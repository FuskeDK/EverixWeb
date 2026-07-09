import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StaffSection from "@/components/StaffSection";
import DiscordSection from "@/components/DiscordSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StaffSection />
      <DiscordSection />
      <footer className="py-8 text-center text-muted-foreground text-sm font-body border-t border-border/50">
        <p>© 2026 ZenithRP. Alle rettigheder forbeholdes.</p>
      </footer>
    </div>
  );
};

export default Index;
