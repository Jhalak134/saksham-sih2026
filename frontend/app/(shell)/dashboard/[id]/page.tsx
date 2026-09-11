// app/(shell)/dashboard/[id]/page.tsx
import { ReportScreen } from '@/components/screens/Report';

interface PageProps {
  readonly params: Promise<{
    id: string;
  }>;
}

export default async function DashboardDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  return <ReportScreen reportId={resolvedParams.id} />;
}
