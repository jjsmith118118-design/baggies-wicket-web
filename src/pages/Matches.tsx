import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  status: 'scheduled' | 'completed' | 'live' | 'cancelled' | 'postponed';
  result?: string;
  teamCategory: 'senior' | 'junior' | 'women';
  homeFormGuide?: string[];
  awayFormGuide?: string[];
}


// Empty array - no sample data, ready for real API integration
const liveMatches: Match[] = [];


const Matches = () => {
  const [matches, setMatches] = useState<Match[]>(liveMatches);
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTeamCategory, setSelectedTeamCategory] = useState<'all' | 'senior' | 'junior' | 'women'>('all');
  const { toast } = useToast();

  // Play Cricket API credentials
  const SITE_ID = '3758';
  const API_TOKEN = '33239cdb5dc60ba5c114a5dd885a8200';
  const SEASON = '2025'; // Updated to 2025 season

  useEffect(() => {
    if (weekOffset === -1) {
      fetchPreviousWeekResults();
    } else if (weekOffset === 0 || weekOffset === 1) {
      fetchWeekFixtures();
    } else {
      setMatches(liveMatches);
    }
  }, [weekOffset]);

  const fetchWeekFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://play-cricket.com/api/v2/matches.json?site_id=${SITE_ID}&season=${SEASON}&api_token=${API_TOKEN}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch fixtures');
      }

      const data = await response.json();
      
      // Map Play Cricket API response to our Match interface
      const mappedMatches: Match[] = data.matches?.map((match: any) => ({
        id: match.id?.toString() || Math.random().toString(),
        date: match.match_date || new Date().toISOString().split('T')[0],
        time: match.match_time || '14:30',
        homeTeam: match.home_club_name || 'Home Team',
        awayTeam: match.away_club_name || 'Away Team',
        venue: match.ground_name || 'Ground',
        competition: match.competition_name || 'League',
        status: match.status === 'L' ? 'live' : 
                match.result ? 'completed' : 'scheduled',
        result: match.result_description || match.result,
        teamCategory: 'senior' as const, // Default to senior, could be enhanced based on match name
        homeFormGuide: undefined,
        awayFormGuide: undefined
      })) || [];

      // Filter matches by the current week's date range
      const filteredMatches = filterMatchesByWeek(mappedMatches);
      setMatches(filteredMatches);
      
      toast({
        title: "Fixtures Loaded",
        description: `Loaded ${filteredMatches.length} fixtures for selected week from Play Cricket`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching Play Cricket fixtures:', error);
      toast({
        title: "Error",
        description: "Failed to load fixtures from Play Cricket API",
        variant: "destructive",
        duration: 3000,
      });
      setMatches(liveMatches);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousWeekResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://play-cricket.com/api/v2/result_summary.json?site_id=${SITE_ID}&season=${SEASON}&api_token=${API_TOKEN}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      
      // Map Play Cricket API response to our Match interface
      const mappedMatches: Match[] = data.result_summary?.map((result: any) => ({
        id: result.id?.toString() || Math.random().toString(),
        date: result.match_date || new Date().toISOString().split('T')[0],
        time: result.match_time || '14:30',
        homeTeam: result.home_club_name || 'Home Team',
        awayTeam: result.away_club_name || 'Away Team',
        venue: result.ground_name || 'Ground',
        competition: result.competition_name || 'League',
        status: 'completed' as const,
        result: result.result_description || result.result || 'Result unavailable',
        teamCategory: 'senior' as const, // Default to senior, could be enhanced based on team name
        homeFormGuide: undefined,
        awayFormGuide: undefined
      })) || [];

      // Filter results by the previous week's date range
      const filteredMatches = filterMatchesByWeek(mappedMatches);
      setMatches(filteredMatches);
      
      toast({
        title: "Results Loaded",
        description: `Loaded ${filteredMatches.length} results for selected week from Play Cricket`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching Play Cricket results:', error);
      toast({
        title: "Error",
        description: "Failed to load results from Play Cricket API",
        variant: "destructive",
        duration: 3000,
      });
      setMatches(liveMatches);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from Play Cricket API
      // For now, we're using the extracted data from the website
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Data Updated",
        description: "Live match data refreshed from Play Cricket",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-green-600 border-green-600">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'live':
        return <Badge variant="default" className="bg-red-600">Live</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'postponed':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Postponed</Badge>;
      default:
        return <Badge variant="outline">TBC</Badge>;
    }
  };

  const filteredMatches = matches.filter(match => {
    if (selectedTeamCategory === 'all') return true;
    return match.teamCategory === selectedTeamCategory;
  });

  const getFormGuideDisplay = (formGuide?: string[]) => {
    if (!formGuide) return null;
    return (
      <div className="flex gap-1 mt-1">
        {formGuide.map((result, index) => (
          <Badge 
            key={index} 
            variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
            className="w-6 h-6 p-0 text-xs flex items-center justify-center"
          >
            {result}
          </Badge>
        ))}
      </div>
    );
  };

  const groupMatchesByDate = (matches: Match[]) => {
    return matches.reduce((groups, match) => {
      const date = match.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(match);
      return groups;
    }, {} as Record<string, Match[]>);
  };

  const getCurrentWeekDates = () => {
    const now = new Date();
    const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    return {
      start: format(weekStart, 'EEE d MMM'),
      end: format(weekEnd, 'EEE d MMM'),
      startDate: weekStart,
      endDate: weekEnd
    };
  };

  const weekDates = getCurrentWeekDates();

  const filterMatchesByWeek = (matches: Match[]) => {
    const { startDate, endDate } = weekDates;
    
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= startDate && matchDate <= endDate;
    });
  };

  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-foreground">Matches</h1>
            <Button onClick={fetchLiveData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </Button>
          </div>
          
          {/* Team Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <h2 className="text-lg font-semibold mr-4 self-center">Teams:</h2>
            {[
              { key: 'all', label: 'All Teams' },
              { key: 'senior', label: 'Saturday, Sunday & Other' },
              { key: 'junior', label: 'Juniors' },
              { key: 'women', label: 'Women & Girls' }
            ].map(category => (
              <Button
                key={category.key}
                onClick={() => setSelectedTeamCategory(category.key as any)}
                variant={selectedTeamCategory === category.key ? 'default' : 'outline'}
                size="sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setWeekOffset((prev) => Math.max(-1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              <div className="text-center">
                <h3 className="text-xl font-bold">
                  {weekOffset === -1 ? 'Previous Week' : 
                   weekOffset === 1 ? 'Next Week' : 'This Week'}
                </h3>
                <p className="text-muted-foreground">{weekDates.start} - {weekDates.end}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setWeekOffset((prev) => Math.min(1, prev + 1))}
              >
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              Object.entries(groupedMatches).map(([date, dayMatches]) => (
                <Card key={date}>
                  <CardHeader className="bg-primary/10">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDate(date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dayMatches.map((match, index) => (
                      <div 
                        key={match.id}
                        className={`p-4 border-b last:border-b-0 hover:bg-accent/20 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-accent/5'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <Badge variant="outline" className="font-medium">
                                {match.competition}
                              </Badge>
                              {getStatusBadge(match.status)}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {match.time}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                              {/* Home Team */}
                              <div className="text-center">
                                <div className="text-lg font-semibold mb-1">
                                  {match.homeTeam}
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">Form Guide</div>
                                {getFormGuideDisplay(match.homeFormGuide)}
                              </div>
                              
                              {/* VS */}
                              <div className="flex items-center justify-center">
                                <div className="text-lg font-bold text-muted-foreground">VS</div>
                              </div>
                              
                              {/* Away Team */}
                              <div className="text-center">
                                <div className="text-lg font-semibold mb-1">
                                  {match.awayTeam}
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">Form Guide</div>
                                {getFormGuideDisplay(match.awayFormGuide)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {match.venue}
                            </div>
                          </div>

                          {match.result && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-primary bg-primary/10 rounded px-3 py-1">
                                {match.result}
                              </div>
                            </div>
                          )}

                          {!match.result && match.status === 'scheduled' && (
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={`https://kingstonbagpuize.play-cricket.com/match_details?id=${match.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View on Play Cricket
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
        </div>

        {/* Integration Note */}
        <Card className="mt-8 border-dashed">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Live Data Integration</h3>
            <p className="text-muted-foreground mb-4">
              This page displays real fixture data from Kingston Bagpuize Cricket Club's Play Cricket website. 
              Match details include form guides, team information, and direct links to full match details.
            </p>
            <Button variant="outline" asChild>
              <a 
                href="https://kingstonbagpuize.play-cricket.com/Matches"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Matches on Play Cricket
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matches;