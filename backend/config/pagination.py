from rest_framework.pagination import PageNumberPagination


class BoundedPageNumberPagination(PageNumberPagination):
    """Default pagination, with an opt-in larger page size.

    Kanban boards and calendars need every task in a project at once to
    render correctly (a board can't just show "page 1" of its columns), so
    those views request a bigger page via ?page_size=. `max_page_size` still
    caps it so a client can't ask for the entire table in one shot
    (section 51: never load every task unbounded).
    """
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 500
