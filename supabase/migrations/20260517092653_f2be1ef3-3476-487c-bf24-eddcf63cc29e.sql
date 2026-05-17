
-- Lock down handle_new_user (only the trigger should invoke it)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Note: rooms intentionally allow open insert/update because friend rooms
-- are designed to be joinable by guests via shared code. State changes are
-- validated server-side via createServerFn (room.functions.ts) using the
-- room code as the access token.
