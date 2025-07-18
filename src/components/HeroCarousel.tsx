import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  primaryAction: {
    text: string;
    href: string;
    external?: boolean;
  };
  secondaryAction: {
    text: string;
    href: string;
    external?: boolean;
  };
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Kingston Bagpuize Cricket Club",
    subtitle: "Where Passion Meets Tradition",
    description: "Welcome to our community cricket club where passion meets tradition. Join us for exciting cricket in the heart of Oxfordshire.",
    image: "/lovable-uploads/1fd3c9ea-3af8-45a9-9050-22734753bfc7.png",
    primaryAction: {
      text: "Join the Club",
      href: "https://kingstonbagpuize.play-cricket.com/home",
      external: true
    },
    secondaryAction: {
      text: "Learn More",
      href: "/about"
    }
  },
  {
    id: 2,
    title: "Competitive Cricket",
    subtitle: "Challenge Yourself",
    description: "Take part in regular league matches and tournaments. Test your skills against local teams in a competitive yet friendly environment.",
    image: "/lovable-uploads/dffb4243-1e34-4ab3-bf62-14c6db8c14a9.png",
    primaryAction: {
      text: "View Fixtures",
      href: "/#fixtures-results"
    },
    secondaryAction: {
      text: "Contact Us",
      href: "/contact"
    }
  },
  {
    id: 3,
    title: "Training & Development",
    subtitle: "Improve Your Game",
    description: "Weekly training sessions with experienced coaches. Perfect for players of all skill levels looking to develop their cricket abilities.",
    image: "/lovable-uploads/87b0f990-614a-4670-8520-e81472557d2d.png",
    primaryAction: {
      text: "Start Training",
      href: "https://kingstonbagpuize.play-cricket.com/home",
      external: true
    },
    secondaryAction: {
      text: "About Us",
      href: "/about"
    }
  }
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides every 15 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative bg-primary text-primary-foreground py-20 overflow-hidden">
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide content */}
        <div className="animate-fade-in">
          {/* Mobile layout - text centered */}
          <div className="text-center lg:hidden">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {currentSlideData.title}
            </h1>
            <p className="text-xl md:text-2xl mb-6 font-medium text-primary-foreground/90">
              {currentSlideData.subtitle}
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-primary-foreground/80">
              {currentSlideData.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {currentSlideData.primaryAction.external ? (
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <a 
                    href={currentSlideData.primaryAction.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {currentSlideData.primaryAction.text}
                  </a>
                </Button>
              ) : currentSlideData.primaryAction.href.includes('#') ? (
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="text-lg px-8 py-3"
                  onClick={() => {
                    const elementId = currentSlideData.primaryAction.href.replace('/#', '');
                    const element = document.getElementById(elementId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {currentSlideData.primaryAction.text}
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <Link to={currentSlideData.primaryAction.href}>
                    {currentSlideData.primaryAction.text}
                  </Link>
                </Button>
              )}
              
              {currentSlideData.secondaryAction.external ? (
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <a 
                    href={currentSlideData.secondaryAction.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {currentSlideData.secondaryAction.text}
                  </a>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <Link to={currentSlideData.secondaryAction.href}>
                    {currentSlideData.secondaryAction.text}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Desktop layout - text and image side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="text-left">
              <h1 className="text-4xl xl:text-6xl font-bold mb-4">
                {currentSlideData.title}
              </h1>
              <p className="text-xl xl:text-2xl mb-6 font-medium text-primary-foreground/90">
                {currentSlideData.subtitle}
              </p>
              <p className="text-lg xl:text-xl mb-8 text-primary-foreground/80">
                {currentSlideData.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {currentSlideData.primaryAction.external ? (
                  <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                    <a 
                      href={currentSlideData.primaryAction.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {currentSlideData.primaryAction.text}
                    </a>
                  </Button>
                ) : currentSlideData.primaryAction.href.includes('#') ? (
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="text-lg px-8 py-3"
                    onClick={() => {
                      const elementId = currentSlideData.primaryAction.href.replace('/#', '');
                      const element = document.getElementById(elementId);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {currentSlideData.primaryAction.text}
                  </Button>
                ) : (
                  <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                    <Link to={currentSlideData.primaryAction.href}>
                      {currentSlideData.primaryAction.text}
                    </Link>
                  </Button>
                )}
                
                {currentSlideData.secondaryAction.external ? (
                  <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                    <a 
                      href={currentSlideData.secondaryAction.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {currentSlideData.secondaryAction.text}
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                    <Link to={currentSlideData.secondaryAction.href}>
                      {currentSlideData.secondaryAction.text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Cricket image with rounded corners matching Card components */}
            <div className="flex justify-center">
              <img 
                src={currentSlideData.image}
                alt="Cricket action at Kingston Bagpuize Cricket Club"
                className="w-full max-w-md h-auto rounded-lg shadow-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;