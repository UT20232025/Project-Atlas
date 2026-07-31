export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050609]">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="atlas-drift-a absolute -left-40 -top-52 h-[560px] w-[560px] rounded-full bg-teal-400/20 blur-[130px]" />

      <div className="atlas-drift-b absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-500/[0.18] blur-[130px]" />

      <div className="atlas-drift-c absolute -bottom-56 left-1/3 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-[140px]" />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}
