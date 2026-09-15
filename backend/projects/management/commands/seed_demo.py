"""Populate the platform with realistic sample data so the app can be
explored and understood without starting from a blank slate.

Idempotent: safe to re-run - projects/users are looked up by name/username
and skipped (not duplicated) if they already exist.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point, Polygon
from django.core.management.base import BaseCommand
from django.utils import timezone

from activity.models import ActivityVerb
from activity.services import log_activity
from comments.models import Comment
from notifications.models import NotificationType
from notifications.services import notify
from projects.models import Board, BoardColumn, Project, ProjectMember
from projects.roles import ADMIN, MANAGER, MEMBER, OWNER, VIEWER
from tasks.models import Tag, Task, TaskAssignee

User = get_user_model()
DEMO_PASSWORD = 'Demo1234!'
TODAY = timezone.now().date()


class Command(BaseCommand):
    help = 'Seed the database with demo users, projects, boards, tasks, comments and notifications.'

    def handle(self, *args, **options):
        users = self._create_users()
        self.stdout.write(self.style.SUCCESS(f'Users ready: {", ".join(users.keys())}'))

        if Project.objects.filter(name='Regional Road Maintenance').exists():
            self.stdout.write(self.style.WARNING('Demo projects already exist - skipping. Delete them first to reseed.'))
            return

        self._seed_road_maintenance(users)
        self._seed_water_infrastructure(users)
        self._seed_park_construction(users)
        self._seed_office_redesign(users)

        self.stdout.write(self.style.SUCCESS('Demo data created. Log in with any of these accounts:'))
        for username in users:
            self.stdout.write(f'  - {username} / {DEMO_PASSWORD}' if username != 'admin' else '  - admin / (your existing password)')

    # ------------------------------------------------------------------ users
    def _create_users(self):
        specs = [
            ('manager_sara', 'Sara', 'Benali', 'Field Operations Manager'),
            ('field_alex', 'Alex', 'Moreau', 'Field Surveyor'),
            ('field_maria', 'Maria', 'Santos', 'Field Inspector'),
            ('viewer_karim', 'Karim', 'Idrissi', 'Regional Director'),
        ]
        users = {}
        admin = User.objects.filter(is_superuser=True).order_by('id').first()
        if admin:
            users[admin.username] = admin

        for username, first, last, job_title in specs:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': f'{username}@selena.demo', 'first_name': first, 'last_name': last},
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            user.profile.job_title = job_title
            user.profile.save(update_fields=['job_title'])
            users[username] = user
        return users

    # --------------------------------------------------------------- helpers
    def _make_project(self, name, description, status, priority, owner, geometry, spatial_type, location_name):
        project = Project.objects.create(
            name=name, description=description, status=status, priority=priority,
            owner=owner, location=geometry, spatial_type=spatial_type, location_name=location_name,
            start_date=TODAY - timedelta(days=30), end_date=TODAY + timedelta(days=60),
        )
        ProjectMember.objects.create(project=project, user=owner, role=OWNER)
        board = Board.objects.create(project=project)
        for i, col_name in enumerate(['Backlog', 'To Do', 'In Progress', 'Review', 'Done']):
            BoardColumn.objects.create(board=board, name=col_name, position=i)
        log_activity(project, owner, ActivityVerb.PROJECT_CREATED, description=f'{owner.username} created the project.')
        return project

    def _add_member(self, project, user, role, actor):
        ProjectMember.objects.create(project=project, user=user, role=role)
        log_activity(project, actor, ActivityVerb.MEMBER_ADDED,
                     description=f'{actor.username} added {user.username} to the project.')
        notify(user, NotificationType.PROJECT_INVITATION, f'{actor.username} added you to project "{project.name}".',
               actor=actor, project=project)

    def _make_task(self, project, column, creator, title, description, priority, status,
                    due_offset_days=None, geometry=None, location_name='', progress=0,
                    tags=None, assignee=None):
        due_date = TODAY + timedelta(days=due_offset_days) if due_offset_days is not None else None
        task = Task.objects.create(
            project=project, board=project.board, column=column, creator=creator,
            title=title, description=description, priority=priority, status=status,
            due_date=due_date, progress=progress,
            location=geometry, spatial_type='point' if geometry else None, location_name=location_name,
        )
        if status == 'done':
            task.completed_at = timezone.now() - timedelta(days=1)
            task.save(update_fields=['completed_at'])
        if tags:
            task.tags.set(tags)
        log_activity(project, creator, ActivityVerb.TASK_CREATED, task=task,
                     description=f'{creator.username} created this task.')
        if assignee:
            TaskAssignee.objects.create(task=task, user=assignee, assigned_by=creator)
            log_activity(project, creator, ActivityVerb.TASK_ASSIGNED, task=task,
                         description=f'{assignee.username} was assigned to this task.')
            notify(assignee, NotificationType.TASK_ASSIGNED, f'{creator.username} assigned you to "{title}".',
                   actor=creator, project=project, task=task)
        return task

    def _comment(self, task, author, content):
        comment = Comment.objects.create(task=task, author=author, content=content)
        log_activity(task.project, author, ActivityVerb.COMMENT_ADDED, task=task,
                     description=f'{author.username} commented on this task.')
        return comment

    # ------------------------------------------------------------- project 1
    def _seed_road_maintenance(self, u):
        route = LineString(
            (-7.6200, 33.5950), (-7.6050, 33.5880), (-7.5898, 33.5731), (-7.5700, 33.5600),
            srid=4326,
        )
        project = self._make_project(
            'Regional Road Maintenance',
            'Periodic inspection and repair of the N7 regional corridor, including bridges and pavement sections.',
            'active', 'high', u['admin'], route, 'line', 'N7 Corridor - Casablanca Region',
        )
        self._add_member(project, u['manager_sara'], MANAGER, u['admin'])
        self._add_member(project, u['field_alex'], MEMBER, u['admin'])
        self._add_member(project, u['field_maria'], MEMBER, u['admin'])

        urgent = Tag.objects.create(project=project, name='Urgent', color='#f43f5e')
        bridge = Tag.objects.create(project=project, name='Bridge', color='#6366f1')
        pavement = Tag.objects.create(project=project, name='Pavement', color='#f59e0b')

        cols = list(project.board.columns.order_by('position'))

        t1 = self._make_task(
            project, cols[2], u['manager_sara'], 'Inspect bridge on route 7',
            'Structural inspection of the Route 7 overpass following the seasonal survey schedule.',
            'high', 'in_progress', due_offset_days=0,
            geometry=Point(-7.5898, 33.5731, srid=4326), location_name='Bridge 7, N7 Corridor',
            progress=40, tags=[bridge], assignee=u['field_alex'],
        )
        self._comment(t1, u['field_alex'], "On site now, deck looks fine but I'll check the support columns next.")
        self._comment(t1, u['manager_sara'], f"Thanks @{u['field_alex'].username}, flag anything above minor wear.")

        self._make_task(
            project, cols[1], u['manager_sara'], 'Survey road section 12-15',
            'Pavement condition survey for kilometer markers 12 to 15.',
            'medium', 'todo', due_offset_days=3,
            geometry=Point(-7.6050, 33.5880, srid=4326), location_name='KM12-15',
            tags=[pavement], assignee=u['field_maria'],
        )

        self._make_task(
            project, cols[2], u['manager_sara'], 'Repair pothole cluster A',
            'Multiple potholes reported near the KM18 junction, high traffic area.',
            'critical', 'blocked', due_offset_days=-2,
            geometry=Point(-7.6200, 33.5950, srid=4326), location_name='KM18 Junction',
            tags=[urgent, pavement], assignee=u['field_alex'],
        )

        self._make_task(
            project, cols[4], u['field_maria'], 'Resurface segment B',
            'Completed resurfacing of segment B ahead of schedule.',
            'medium', 'done', due_offset_days=-5, progress=100,
            geometry=Point(-7.5700, 33.5600, srid=4326), location_name='Segment B', tags=[pavement],
        )

        self._make_task(
            project, cols[0], u['admin'], 'Plan Q3 inspection route',
            'Draft the inspection route and schedule for next quarter.',
            'low', 'todo', due_offset_days=20,
        )

    # ------------------------------------------------------------- project 2
    def _seed_water_infrastructure(self, u):
        site = Point(-7.6300, 33.5500, srid=4326)
        project = self._make_project(
            'Water Infrastructure Inspection',
            'Field inspections of pumping stations, valves and treatment facilities across the district.',
            'active', 'critical', u['admin'], site, 'point', 'District Water Treatment Plant',
        )
        self._add_member(project, u['manager_sara'], ADMIN, u['admin'])
        self._add_member(project, u['field_maria'], MEMBER, u['admin'])
        self._add_member(project, u['viewer_karim'], VIEWER, u['admin'])

        cols = list(project.board.columns.order_by('position'))

        self._make_task(
            project, cols[2], u['manager_sara'], 'Inspect water treatment plant',
            'Quarterly safety and compliance inspection of the main treatment facility.',
            'critical', 'in_progress', due_offset_days=1,
            geometry=site, location_name='Main Treatment Plant', progress=60, assignee=u['field_maria'],
        )
        self._make_task(
            project, cols[1], u['manager_sara'], 'Check valve station 12',
            'Routine check of pressure valves at station 12.',
            'medium', 'todo', due_offset_days=5,
            geometry=Point(-7.6450, 33.5620, srid=4326), location_name='Valve Station 12',
        )
        self._make_task(
            project, cols[3], u['field_maria'], 'Validate parcel boundary near reservoir',
            'Confirm the reservoir easement boundary against the cadastral record.',
            'low', 'in_review', due_offset_days=7,
            geometry=Point(-7.6150, 33.5480, srid=4326), location_name='North Reservoir',
        )

    # ------------------------------------------------------------- project 3
    def _seed_park_construction(self, u):
        boundary = Polygon((
            (-7.6000, 33.5800), (-7.5950, 33.5800), (-7.5950, 33.5850),
            (-7.6000, 33.5850), (-7.6000, 33.5800),
        ), srid=4326)
        project = self._make_project(
            'Downtown Park Construction',
            'Development of the new downtown public park, including grading, irrigation and planting phases.',
            'planning', 'medium', u['admin'], boundary, 'polygon', 'Downtown Park Zone',
        )
        self._add_member(project, u['field_alex'], MEMBER, u['admin'])

        cols = list(project.board.columns.order_by('position'))

        self._make_task(project, cols[0], u['admin'], 'Site grading', 'Level the site ahead of irrigation works.',
                        'high', 'todo', due_offset_days=10)
        self._make_task(project, cols[0], u['admin'], 'Install irrigation system', 'Lay out the irrigation network per the landscape plan.',
                        'medium', 'todo', due_offset_days=25)
        self._make_task(project, cols[0], u['admin'], 'Plant trees - phase 1', 'First planting phase along the north perimeter.',
                        'medium', 'todo', due_offset_days=40)

    # ------------------------------------------------------------- project 4
    def _seed_office_redesign(self, u):
        project = self._make_project(
            'Office Redesign',
            'Non-geographic project: refresh of the main office layout and furniture.',
            'active', 'low', u['admin'], None, None, '',
        )
        self._add_member(project, u['manager_sara'], MEMBER, u['admin'])
        cols = list(project.board.columns.order_by('position'))

        self._make_task(project, cols[1], u['admin'], 'Choose furniture vendor', 'Compare quotes from three vendors.',
                        'low', 'todo', due_offset_days=14, assignee=u['manager_sara'])
        self._make_task(project, cols[0], u['admin'], 'Finalize floor plan', 'Get sign-off on the new open-plan layout.',
                        'medium', 'todo', due_offset_days=6)
