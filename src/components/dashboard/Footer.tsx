export const Footer = () => {
  return (
    <footer className="h-auto md:h-12 bg-card/50 backdrop-blur-sm border-t border-border flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-2 md:py-0 gap-2 md:gap-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <img
          src="/architecture-and-city.png"
          alt="CityFlow Logo"
          className="w-4 h-4 object-contain"
        />
        <span className="text-xs md:text-sm">
          <span className="hidden sm:inline">AI-powered Intelligent Transportation System</span>
          <span className="sm:hidden">CityFlow</span>
        </span>
      </div>
      <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground flex-wrap justify-center">
        <span className="font-semibold text-foreground">HackForge'25</span>
        <span className="text-border hidden md:inline">|</span>
        <span className="text-center">
          Sponsored by <span className="text-primary">WEBBED</span> &{" "}
          <span className="text-primary">Sensense Solutions</span>
        </span>
      </div>
    </footer>
  );
};
