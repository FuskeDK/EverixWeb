import { Car, Shield, Users, Briefcase, Zap, MapPin } from "lucide-react";

const features = [
  { icon: Shield, title: "Aktiv Politistyrke", desc: "Organiseret politi med realistiske procedurer og jagt-scenarier." },
  { icon: Briefcase, title: "Kriminel Underverden", desc: "Start bander, håndter drugs, og kæmp om territorier." },
  { icon: Car, title: "Custom Biler", desc: "Hundredvis af importerede køretøjer med tuning-muligheder." },
  { icon: Users, title: "Aktivt Community", desc: "Et venligt og engageret community med daglige events." },
  { icon: MapPin, title: "Custom Map", desc: "Unikke lokationer, huse og forretninger du kan eje." },
  { icon: Zap, title: "Optimeret Server", desc: "Stabilt FPS og lav ping for den bedste spiloplevelse." },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-2">Features</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            Hvad vi tilbyder
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-6 bg-card hover:bg-secondary/50 transition-colors"
            >
              <f.icon className="w-8 h-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
