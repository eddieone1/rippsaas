export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1F2121] flex flex-col items-center">
      <div className="flex-[0.35] flex items-end justify-center pb-6" aria-hidden>
        {/* Spacer: less than half so logo sits higher */}
      </div>
      <a href="/" className="flex justify-center flex-shrink-0">
        <img
          src="/rip logo updated.png"
          alt="Rip"
          className="h-[10.5rem] w-auto object-contain"
        />
      </a>
      <div className="flex-1 flex items-start justify-center pt-8 w-full">
        {children}
      </div>
    </div>
  );
}
