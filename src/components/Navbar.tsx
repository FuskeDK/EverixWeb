const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center">
        <div className="flex items-center gap-10 text-sm text-foreground/80">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#staff" className="hover:text-foreground transition-colors">Staff</a>
          <a href="/#discord" className="hover:text-foreground transition-colors">Discord</a>
          <a href="/regler" className="hover:text-foreground transition-colors">Regler</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
