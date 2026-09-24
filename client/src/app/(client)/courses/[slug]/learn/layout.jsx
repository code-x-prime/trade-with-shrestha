export const metadata = {
  robots: { index: false, follow: false },
};

export default function LearnLayout({ children }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
