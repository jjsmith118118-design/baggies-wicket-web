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

      {/* Contact Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Get In Touch</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Whether you're interested in joining the club, want to know about fixtures, 
                  or have any questions, we'd love to hear from you.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
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

                <Card>
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

                <Card>
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


                <Card>
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

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Enter your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Enter your last name" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What is this regarding?" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us how we can help you..."
                      rows={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;