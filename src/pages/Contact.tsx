import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Get in touch with Kingston Bagpuize Cricket Club
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Get In Touch</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you're interested in joining the club, want to know about fixtures, 
              or have any questions, we'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Ground Location</h3>
                    <p className="text-muted-foreground">
                      Kingston Bagpuize Cricket Ground<br />
                      Kingston Bagpuize, Oxfordshire<br />
                      OX13 5AP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Instagram className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Instagram</h3>
                    <p className="text-muted-foreground">
                      <a 
                        href="https://www.instagram.com/baggiescricket/"
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => {
                          // Try to open in Instagram app first, fallback to web
                          const appUrl = "instagram://user?username=baggiescricket";
                          const webUrl = "https://www.instagram.com/baggiescricket/";
                          
                          // Create a hidden iframe to test if the app can be opened
                          const iframe = document.createElement("iframe");
                          iframe.style.display = "none";
                          iframe.src = appUrl;
                          document.body.appendChild(iframe);
                          
                          // If app doesn't open within 2 seconds, open web version
                          setTimeout(() => {
                            document.body.removeChild(iframe);
                          }, 2000);
                          
                          // Also set the href to web URL as fallback
                          setTimeout(() => {
                            if (document.visibilityState === "visible") {
                              window.open(webUrl, "_blank");
                            }
                          }, 500);
                          
                          e.preventDefault();
                        }}
                      >
                        @baggiescricket
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Email</h3>
                    <p className="text-muted-foreground">
                      kingstonbagpuizecc@gmail.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Training Times</h3>
                    <p className="text-muted-foreground">
                      Tuesday evenings: 6:00 PM - 8:00 PM<br />
                      Sunday mornings: 10:00 AM - 12:00 PM<br />
                      Match days:{" "}
                      <a 
                        href="/#fixtures-results" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        As scheduled - click here
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/940df71c-ecca-45d0-8757-22ca8e66ee5a.png" 
                alt="Cricket match in action at Kingston Bagpuize Cricket Club" 
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Don't leave it too soon.
              </h2>
              <p className="text-2xl md:text-3xl text-primary font-semibold mb-8">
                Get in touch!
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a seasoned player or just starting out, there's a place for you at Kingston Bagpuize Cricket Club. 
                Join our community and be part of something special.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="mailto:kingstonbagpuizecc@gmail.com"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Email Us Now
                </a>
                <a 
                  href="https://www.instagram.com/baggiescricket/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-semibold"
                >
                  Follow on Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;