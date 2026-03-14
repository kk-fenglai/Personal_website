import { ThoughtDetail } from "./ThoughtDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ThoughtPage({ params }: Props) {
  const { id } = await params;
  return <ThoughtDetail thoughtId={id} />;
}
