export const Footer = () => {
  return (
    <footer className="h-12 bg-card/50 border-t border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <img
          src="/architecture-and-city.png"
          alt="CityFlow Logo"
          className="w-4 h-4 object-contain"
        />
        <span className="text-sm">
          AI-powered Intelligent Transportation System
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">HackForge'25</span>
        <span className="text-border">|</span>
        <span>
          Sponsored by <span className="text-primary">WEBBED</span> &{" "}
          <span className="text-primary">Sensense Solutions</span>
        </span>
      </div>
    </footer>
  );
};
