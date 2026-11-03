import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="bg-primary border-b-[3px] border-secondary print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4 sm:gap-5">
        <Image
          src="/wvas-mark.jpg"
          alt="Welland Valley Art Society"
          width={64}
          height={64}
          className="flex-shrink-0 bg-white object-contain p-1"
          priority
        />
        <div>
          <p className="text-secondary text-[11px] tracking-[0.18em] uppercase mb-1">Welland Valley Art Society</p>
          <h1 className="font-display text-xl sm:text-2xl text-primary-content font-normal leading-tight">
            Exhibitor Applicant Preview/Remote Judging
          </h1>
        </div>
      </div>
    </header>
  );
}
