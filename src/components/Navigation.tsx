import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink, Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/', external: false },
    { name: 'About Us', path: '/about', external: false },
    { name: 'Matches', path: '/matches', external: false },
    { name: 'Juniors', path: '/juniors', external: false },
    { name: 'Club Store', path: 'https://www.serioussport.co.uk/teamstores/kingston-bagpuize', external: true },
    { name: 'Contact Us', path: '/contact', external: false },
  ];
  const membersActive = location.pathname.startsWith('/members');

  const isActive = (path: string, external: boolean) =>
    !external && (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <nav className={`bg-background border-b border-border sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/a5ad1992-fbda-44b7-a120-24dc8f17ed02.png" 
              alt="Kingston Bagpuize Cricket Club Logo" 
              className="h-12 w-12"
            />
            <div className="text-xl font-bold text-primary">Kingston Bagpuize CC</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex space-x-4">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary after:absolute after:left-3 after:right-3 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 inline-flex items-center gap-1"
                  >
                    {item.name}
                    <ExternalLink className="h-3 w-3 opacity-60" aria-label="(opens in a new tab)" />
                  </a>
                ) : item.path.includes('#') ? (
                  <a
                    key={item.name}
                    href={item.path}
                    className="relative px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary after:absolute after:left-3 after:right-3 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                    onClick={(e) => {
                      if (item.path.startsWith('/#')) {
                        e.preventDefault();
                        const elementId = item.path.replace('/#', '');
                        const element = document.getElementById(elementId);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-3 py-2 text-sm font-medium transition-colors after:absolute after:left-3 after:right-3 after:-bottom-px after:h-0.5 after:origin-left after:bg-primary after:transition-transform after:duration-300 ${
                      isActive(item.path, item.external)
                        ? 'text-primary after:scale-x-100'
                        : 'text-foreground hover:text-primary after:scale-x-0 hover:after:scale-x-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
            <Button asChild size="sm" variant={membersActive ? 'secondary' : 'default'}>
              <Link to="/members">Members</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-base font-medium transition-colors text-foreground hover:text-primary hover:bg-accent"
                  >
                    {item.name}
                    <ExternalLink className="h-4 w-4 opacity-60" aria-label="(opens in a new tab)" />
                  </a>
                ) : item.path.includes('#') ? (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      if (item.path.startsWith('/#')) {
                        const elementId = item.path.replace('/#', '');
                        const element = document.getElementById(elementId);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="block px-3 py-2 text-base font-medium transition-colors text-foreground hover:text-primary hover:bg-accent"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${
                      isActive(item.path, item.external)
                        ? 'text-primary bg-accent'
                        : 'text-foreground hover:text-primary hover:bg-accent'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              <div className="px-3 pt-2">
                <Button asChild className="w-full">
                  <Link to="/members" onClick={() => setIsOpen(false)}>Members</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
