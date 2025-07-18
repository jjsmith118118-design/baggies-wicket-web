import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Calendar, Clock, Users, Trophy } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Club Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="/lovable-uploads/a5ad1992-fbda-44b7-a120-24dc8f17ed02.png" 
                alt="Kingston Bagpuize Cricket Club Logo" 
                className="h-12 w-12"
              />
              <div>
                <h3 className="text-xl font-bold">Kingston Bagpuize CC</h3>
                <p className="text-sm opacity-90">Est. 1834</p>
              </div>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              A welcoming community cricket club in the heart of Oxfordshire, 
              bringing together cricket enthusiasts of all ages and abilities since 1834.
            </p>
          </div>

          {/* Contact & Location */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Contact & Location</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0 opacity-80" />
                <div className="text-sm opacity-90">
                  <p>The Sportsfield</p>
                  <p>Abingdon Road (A415)</p>
                  <p>Kingston Bagpuize, Abingdon</p>
                  <p>OX13 5GD</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 opacity-80" />
                <a 
                  href="mailto:kbcc.secretary@gmail.com" 
                  className="text-sm opacity-90 hover:opacity-100 transition-opacity"
                >
                  kbcc.secretary@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link 
                to="/about" 
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                About Us
              </Link>
              <a 
                href="https://kingstonbagpuize.play-cricket.com/Matches" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Fixtures & Results
              </a>
              <a 
                href="https://www.serioussport.co.uk/teamstores/kingston-bagpuize" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Club Store
              </a>
              <Link 
                to="/contact" 
                className="block text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Club Officers */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Club Officers</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Chair</p>
                <p className="opacity-90">David Warner</p>
              </div>
              <div>
                <p className="font-medium">Secretary</p>
                <p className="opacity-90">Kate Ricks</p>
              </div>
              <div>
                <p className="font-medium">Treasurer</p>
                <p className="opacity-90">Jordan Smith</p>
              </div>
              <div>
                <p className="font-medium">Fixture Secretary</p>
                <p className="opacity-90">Tom Scrase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-sm opacity-80">
            © 2025 Kingston Bagpuize Cricket Club. All rights reserved. | Affiliated to Oxfordshire Cricket Board
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;