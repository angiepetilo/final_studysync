import CollaborationRoomPageClient from './CollaborationRoomPageClient'

export async function generateStaticParams() {
  return [{ id: 'room' }]
}

export default function CollaborationRoomPage({ params }: { params: { id: string } }) {
  return <CollaborationRoomPageClient id={params.id} />
}
