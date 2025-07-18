import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  status: 'upcoming' | 'completed' | 'in-progress';
  result?: string;
  teamCategory: 'senior' | 'junior' | 'women';
}

// Mock data structure based on Play Cricket format
const mockMatches: Match[] = [
  {
    id: '1',
    date: '2025-07-19',
    time: '12:30',
    homeTeam: 'Kingston Bagpuize CC 1st XI',
    awayTeam: 'Cumnor CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'League',
    status: 'upcoming',
    teamCategory: 'senior'
  },
  {
    id: '2',
    date: '2025-07-19',
    time: '13:00',
    homeTeam: 'Oxford Downs CC 3rd XI',
    awayTeam: 'Kingston Bagpuize CC 2nd XI',
    venue: 'Away',
    competition: 'League',
    status: 'upcoming',
    teamCategory: 'senior'
  },
  {
    id: '3',
    date: '2025-07-20',
    time: '10:00',
    homeTeam: 'Witney Mills CC Under 11',
    awayTeam: 'Kingston Bagpuize CC Under 11',
    venue: 'Away',
    competition: 'Junior League',
    status: 'upcoming',
    teamCategory: 'junior'
  },
  {
    id: '4',
    date: '2025-07-22',
    time: '18:00',
    homeTeam: 'Wolvercote CC Under 15',
    awayTeam: 'Kingston Bagpuize CC Under 15',
    venue: 'Away',
    competition: 'Junior League',
    status: 'upcoming',
    teamCategory: 'junior'
  }
];

const FixturesResults = () => {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'senior' | 'junior' | 'women'>('all');
  const { toast } = useToast();

  // Function to fetch data from Play Cricket API
  const fetchMatchData = async () => {
    setLoading(true);
    try {
      // This would be the actual API call to Play Cricket
      // const response = await fetch(`https://play-cricket.com/api/v2/matches.json?site_id=YOUR_SITE_ID&season=2025&api_token=YOUR_API_TOKEN`);
      // const data = await response.json();
      
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Data Updated",
        description: "Fixtures and results have been refreshed",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch match data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'all') return true;
    return match.teamCategory === activeTab;
  });

  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = match.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {} as Record<string, Match[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="default">Live</Badge>;
      default:
        return <Badge variant="outline">TBC</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Fixtures & Results</h2>
          <p className="text-muted-foreground mt-1">
            Upcoming matches and recent results for all teams
          </p>
        </div>
        <Button 
          onClick={fetchMatchData} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Teams', count: matches.length },
          { key: 'senior', label: 'Saturday, Sunday & Other', count: matches.filter(m => m.teamCategory === 'senior').length },
          { key: 'junior', label: 'Junior', count: matches.filter(m => m.teamCategory === 'junior').length },
          { key: 'women', label: 'Women & Girls', count: matches.filter(m => m.teamCategory === 'women').length }
        ].map(tab => (
          <Button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Matches by Date */}
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([date, dayMatches]) => (
          <Card key={date} className="overflow-hidden">
            <CardHeader className="bg-accent/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                {formatDate(date)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {dayMatches.map((match, index) => (
                  <div 
                    key={match.id}
                    className={`p-4 border-b last:border-b-0 hover:bg-accent/20 transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-accent/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Match Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{match.time}</span>
                          </div>
                          {getStatusBadge(match.status)}
                          <Badge variant="outline" className="text-xs">
                            {match.competition}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {/* Teams */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{match.homeTeam}</span>
                            </div>
                            <div className="text-muted-foreground">vs</div>
                            <div className="flex-1 text-right">
                              <span className="font-medium">{match.awayTeam}</span>
                            </div>
                          </div>
                          
                          {/* Venue */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{match.venue}</span>
                          </div>
                        </div>
                      </div>

                      {/* Result or Action */}
                      <div className="flex items-center gap-2">
                        {match.result ? (
                          <div className="text-sm font-medium text-center">
                            <div className="text-primary">{match.result}</div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Integration Note */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Live Data Integration</h3>
          <p className="text-muted-foreground mb-4">
            This component is ready to integrate with the Play Cricket API. To enable live data:
          </p>
          <div className="space-y-2 text-sm text-left max-w-2xl mx-auto">
            <p>1. Obtain your Club ID from Play Cricket (Kingston Bagpuize CC)</p>
            <p>2. Request API access from Play Cricket</p>
            <p>3. Configure the API token in your environment</p>
            <p>4. Enable automatic data refresh</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.open('https://play-cricket.ecb.co.uk/hc/en-us/sections/360000978518-API-Experienced-Developers-Only', '_blank')}
          >
            View API Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixturesResults;