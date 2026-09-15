from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token):
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from rest_framework_simplejwt.tokens import AccessToken
    from django.contrib.auth import get_user_model

    try:
        validated = AccessToken(token)
        user = get_user_model().objects.get(id=validated['user_id'])
        return user
    except (TokenError, InvalidToken, get_user_model().DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Authenticates WebSocket connections using a JWT passed as ?token=.

    The frontend has no session cookie (it's a pure JWT/DRF setup), so the
    default Channels AuthMiddlewareStack (session-based) cannot identify the
    user. This mirrors that same JWT on the WebSocket handshake instead.
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        scope['user'] = await get_user_from_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
