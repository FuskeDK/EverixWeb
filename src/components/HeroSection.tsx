import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4">
          Velkommen til
        </p>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-foreground">
          ZenithRP
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Det mest intense roleplay-univers i Danmark. Byg dit imperium, skab din historie, lev livet på kanten.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="fivem://connect/193.181.23.172:30120"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 border border-border text-foreground text-sm rounded-md hover:bg-secondary transition-colors"
          >
            Tilslut Server
          </a>
          <a
            href="https://discord.gg/8psYBEyd"
            className="px-8 py-3 border border-border text-muted-foreground text-sm rounded-md hover:bg-secondary hover:text-foreground transition-colors"
          >
            Join Discord
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
