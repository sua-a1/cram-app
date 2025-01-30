import { redirect } from 'next/navigation';
import { getDocument } from '@/app/actions/knowledge';
import { getCurrentUser } from '@/lib/server/auth-logic';
import { DocumentView } from '@/components/knowledge/document-view';

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const { data: document, error } = await getDocument(params.id);
  if (error || !document) {
    redirect('/org/knowledge');
  }

  const isAdmin = user.role === 'admin';

  return <DocumentView document={document} isAdmin={isAdmin} />;
} 
