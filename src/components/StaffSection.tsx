const staff = [
  { name: "Mum", role: "Projekt Leder / Server Developer" },
  { name: "LynX", role: "Projekt Lead" },
  { name: "Gustav23", role: "Administrator" },
  { name: "Phillip", role: "Administrator" },
  { name: "w0lttex", role: "Administrator" },
  { name: "Klunke john", role: "Head Staff" },
  { name: "zwaxyy", role: "Staff" },
];

const StaffSection = () => {
  return (
    <section className="py-24 px-4" id="staff">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-2">Staff</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            Holdet bag ZenithRP
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff.map((s, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-6 text-center bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center border border-border">
                <span className="text-xl font-semibold text-foreground">
                  {s.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{s.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StaffSection;
