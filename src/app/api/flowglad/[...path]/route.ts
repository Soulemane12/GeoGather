// Temporarily disabled until Flowglad is properly configured
// import { createAppRouterRouteHandler } from '@flowglad/nextjs/server';
// import { flowgladServer } from '@/lib/flowglad';

// const routeHandler = createAppRouterRouteHandler(flowgladServer);

// export { routeHandler as GET, routeHandler as POST }

export async function GET() {
  return new Response('Flowglad API not configured yet', { status: 501 })
}

export async function POST() {
  return new Response('Flowglad API not configured yet', { status: 501 })
}
