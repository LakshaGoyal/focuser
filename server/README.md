# Focuser Server (Backend Placeholder)

This directory contains the minimal architecture placeholder for future Express backend development.

## Scope & Non-Goals for Initial MVP

- **Authentication**: Intentionally NOT implemented for MVP.
- **Database (MongoDB)**: Intentionally NOT implemented for MVP.
- **Admin & Analytics**: Intentionally NOT implemented for MVP.

All current MVP focus control is handled locally via direct WebSocket communication (`127.0.0.1:4545`) between the React frontend (`client`) and the local desktop agent (`agent`).
