import React, { useState, useMemo } from "react";
import { Job, User } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Target, Send, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";

interface EnhancedJobListViewProps {
  jobs: Job[];
  staff: User[];
  user: User | null;
  effectiveUser: User | null;
  searchTerm: string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  handleJobEdit: (job: Job) => void;
  handleJobPDFDownload: (job: Job) => void;
  handleJobContextMenu: (e: React.MouseEvent, job: Job) => void;
  setSelectedJobForTimeEdit: (job: Job | null) => void;
  setShowJobTimeEditor: (show: boolean) => void;
  setSelectedJobForAssignment: (job: Job | null) => void;
  setShowSmartAssignment: (show: boolean) => void;
  setSelectedJobForSendAgain: (job: Job | null) => void;
  setShowSendAgain: (show: boolean) => void;
}

type ViewMode = "all" | "today" | "week" | "month";
type JobStatus = "current" | "completed";

const JobCard = ({ 
  job, 
  staff, 
  user, 
  effectiveUser, 
  getPriorityColor, 
  getStatusColor, 
  handleJobEdit,
  handleJobPDFDownload,
  handleJobContextMenu,
  setSelectedJobForTimeEdit,
  setShowJobTimeEditor,
  setSelectedJobForAssignment,
  setShowSmartAssignment,
  setSelectedJobForSendAgain,
  setShowSendAgain,
  isAdmin
}: {
  job: Job;
  staff: User[];
  user: User | null;
  effectiveUser: User | null;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  handleJobEdit: (job: Job) => void;
  handleJobPDFDownload: (job: Job) => void;
  handleJobContextMenu: (e: React.MouseEvent, job: Job) => void;
  setSelectedJobForTimeEdit: (job: Job | null) => void;
  setShowJobTimeEditor: (show: boolean) => void;
  setSelectedJobForAssignment: (job: Job | null) => void;
  setShowSmartAssignment: (show: boolean) => void;
  setSelectedJobForSendAgain: (job: Job | null) => void;
  setShowSendAgain: (show: boolean) => void;
  isAdmin?: boolean;
}) => {
  const assignedStaff = staff.find((s) => s.id === job.assignedTo);
  
  return (
    <Card
      className={`transition-all hover:shadow-md cursor-pointer ${isAdmin ? 'admin-compact card-compact' : ''}`}
      onDoubleClick={() => {
        if (user?.role === "admin") {
          setSelectedJobForTimeEdit(job);
          setShowJobTimeEditor(true);
        } else {
          handleJobEdit(job);
        }
      }}
      onContextMenu={(e) => handleJobContextMenu(e, job)}
      title={
        user?.role === "admin" ||
        user?.role === "supervisor"
          ? "Double-click to edit | Right-click for options"
          : "Double-click to edit job"
      }
    >
      <CardContent className={isAdmin ? 'admin-compact card-compact p-3' : 'p-4'}>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium truncate ${isAdmin ? 'text-sm' : 'text-base'}`} title={job.title}>
                {job.title}
              </h3>
              <p className={`text-gray-600 line-clamp-2 ${isAdmin ? 'text-xs' : 'text-sm'}`}>
                {job.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={getPriorityColor(job.priority)} 
                className={isAdmin ? 'text-xs' : ''}
              >
                {job.priority}
              </Badge>
              <Badge 
                className={`${getStatusColor(job.status)} ${isAdmin ? 'text-xs' : ''}`}
              >
                {job.status}
              </Badge>
            </div>
          </div>

          {/* Job details */}
          <div className={`space-y-1 ${isAdmin ? 'text-xs' : 'text-sm'} text-gray-500`}>
            {job.claimNo && <p>Claim: {job.claimNo}</p>}
            {job.insuredName && <p>Client: {job.insuredName}</p>}
            {job.riskAddress && <p>Address: {job.riskAddress}</p>}
            {assignedStaff && (
              <p className="text-blue-600">
                Assigned: {assignedStaff.name}
              </p>
            )}
            {job.dueDate && (
              <p className="text-orange-600">
                Due: {format(new Date(job.dueDate), "MMM dd, yyyy h:mm a")}
              </p>
            )}
            {job.excess && (
              <p className="text-green-600">
                Excess: {job.excess}
              </p>
            )}
          </div>

          {/* Action buttons - responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size={isAdmin ? "sm" : "sm"}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleJobEdit(job);
              }}
              className={`flex-1 sm:flex-none ${isAdmin ? 'admin-compact btn-compact' : ''}`}
            >
              {effectiveUser?.role === 'staff' ? 'View' : 'Edit'}
            </Button>
            
            {job.status === "completed" && (
              <Button
                size={isAdmin ? "sm" : "sm"}
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJobPDFDownload(job);
                }}
                className={`flex-1 sm:flex-none text-purple-600 border-purple-600 hover:bg-purple-50 ${isAdmin ? 'admin-compact btn-compact' : ''}`}
              >
                <FileText className="h-3 w-3 mr-1" />
                PDF
              </Button>
            )}
            
            {effectiveUser?.role !== 'staff' && !job.assignedTo && (
              <Button
                size={isAdmin ? "sm" : "sm"}
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJobForAssignment(job);
                  setShowSmartAssignment(true);
                }}
                className={`flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50 ${isAdmin ? 'admin-compact btn-compact' : ''}`}
              >
                <Target className="h-3 w-3 mr-1" />
                Assign
              </Button>
            )}
            
            {effectiveUser?.role !== 'staff' && job.assignedTo && (
              <Button
                size={isAdmin ? "sm" : "sm"}
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJobForSendAgain(job);
                  setShowSendAgain(true);
                }}
                className={`flex-1 sm:flex-none text-blue-600 border-blue-600 hover:bg-blue-50 ${isAdmin ? 'admin-compact btn-compact' : ''}`}
              >
                <Send className="h-3 w-3 mr-1" />
                Send Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function EnhancedJobListView({
  jobs,
  staff,
  user,
  effectiveUser,
  searchTerm,
  getPriorityColor,
  getStatusColor,
  handleJobEdit,
  handleJobPDFDownload,
  handleJobContextMenu,
  setSelectedJobForTimeEdit,
  setShowJobTimeEditor,
  setSelectedJobForAssignment,
  setShowSmartAssignment,
  setSelectedJobForSendAgain,
  setShowSendAgain
}: EnhancedJobListViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['current']));
  
  const isAdmin = user?.role === 'admin';

  // Group jobs by status
  const currentJobs = jobs.filter(job => job.status !== 'completed');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  // Get date range for current view
  const getDateRange = () => {
    const today = new Date();
    switch (viewMode) {
      case "today":
        return { start: today, end: today };
      case "week":
        return { 
          start: startOfWeek(currentWeek, { weekStartsOn: 1 }), 
          end: endOfWeek(currentWeek, { weekStartsOn: 1 }) 
        };
      case "month":
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end };
      default:
        return null;
    }
  };

  // Filter jobs by date range
  const filterJobsByDate = (jobsList: Job[]) => {
    if (viewMode === "all") return jobsList;
    
    const dateRange = getDateRange();
    if (!dateRange) return jobsList;

    return jobsList.filter(job => {
      if (!job.dueDate) return false;
      const jobDate = new Date(job.dueDate);
      return jobDate >= dateRange.start && jobDate <= dateRange.end;
    });
  };

  // Group jobs by day for weekly view
  const groupJobsByDay = (jobsList: Job[]) => {
    if (viewMode !== "week") return null;
    
    const dateRange = getDateRange();
    if (!dateRange) return null;

    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => ({
      date: day,
      jobs: jobsList.filter(job => {
        if (!job.dueDate) return false;
        return isSameDay(new Date(job.dueDate), day);
      })
    }));
  };

  const filteredCurrentJobs = filterJobsByDate(currentJobs);
  const filteredCompletedJobs = filterJobsByDate(completedJobs);

  const currentJobsByDay = groupJobsByDay(filteredCurrentJobs);
  const completedJobsByDay = groupJobsByDay(filteredCompletedJobs);

  const formatDayHeader = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM dd");
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchTerm
          ? `No jobs found matching "${searchTerm}"`
          : "No jobs found. Create your first job to get started."}
      </div>
    );
  }

  const renderJobsList = (jobsList: Job[], title: string, sectionKey: string, badgeColor: string) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <Card className={isAdmin ? 'admin-compact' : ''}>
        <CardHeader 
          className={`cursor-pointer ${isAdmin ? 'admin-compact card-compact py-2' : 'py-4'}`}
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className={isAdmin ? 'text-base' : 'text-lg'}>
                {title}
              </CardTitle>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <Badge variant="outline" className={`${badgeColor} ${isAdmin ? 'text-xs' : ''}`}>
              {jobsList.length} {jobsList.length === 1 ? 'job' : 'jobs'}
            </Badge>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className={isAdmin ? 'admin-compact card-compact pt-0' : 'pt-0'}>
            {jobsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {sectionKey} jobs found.
              </div>
            ) : viewMode === "week" ? (
              // Weekly grouped view
              <div className="space-y-4">
                {(sectionKey === 'current' ? currentJobsByDay : completedJobsByDay)?.map(({ date, jobs: dayJobs }) => (
                  <div key={date.toISOString()} className="space-y-2">
                    <h4 className={`font-medium text-gray-700 border-b pb-1 ${isAdmin ? 'text-sm' : 'text-base'}`}>
                      {formatDayHeader(date)} ({dayJobs.length})
                    </h4>
                    {dayJobs.length === 0 ? (
                      <p className={`text-gray-400 italic ${isAdmin ? 'text-xs' : 'text-sm'}`}>
                        No jobs scheduled
                      </p>
                    ) : (
                      <div className={`grid gap-3 ${isAdmin ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                        {dayJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            staff={staff}
                            user={user}
                            effectiveUser={effectiveUser}
                            getPriorityColor={getPriorityColor}
                            getStatusColor={getStatusColor}
                            handleJobEdit={handleJobEdit}
                            handleJobPDFDownload={handleJobPDFDownload}
                            handleJobContextMenu={handleJobContextMenu}
                            setSelectedJobForTimeEdit={setSelectedJobForTimeEdit}
                            setShowJobTimeEditor={setShowJobTimeEditor}
                            setSelectedJobForAssignment={setSelectedJobForAssignment}
                            setShowSmartAssignment={setShowSmartAssignment}
                            setSelectedJobForSendAgain={setSelectedJobForSendAgain}
                            setShowSendAgain={setShowSendAgain}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Regular list view
              <div className={`grid gap-3 ${isAdmin ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {jobsList.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    staff={staff}
                    user={user}
                    effectiveUser={effectiveUser}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    handleJobEdit={handleJobEdit}
                    handleJobPDFDownload={handleJobPDFDownload}
                    handleJobContextMenu={handleJobContextMenu}
                    setSelectedJobForTimeEdit={setSelectedJobForTimeEdit}
                    setShowJobTimeEditor={setShowJobTimeEditor}
                    setSelectedJobForAssignment={setSelectedJobForAssignment}
                    setShowSmartAssignment={setShowSmartAssignment}
                    setSelectedJobForSendAgain={setSelectedJobForSendAgain}
                    setShowSendAgain={setShowSendAgain}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* View controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className={`w-full sm:w-32 ${isAdmin ? 'admin-compact h-8 text-sm' : ''}`}>
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          {viewMode === "week" && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size={isAdmin ? "sm" : "sm"}
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className={isAdmin ? 'admin-compact btn-compact' : ''}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size={isAdmin ? "sm" : "sm"}
                onClick={() => setCurrentWeek(new Date())}
                className={isAdmin ? 'admin-compact btn-compact' : ''}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size={isAdmin ? "sm" : "sm"}
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className={isAdmin ? 'admin-compact btn-compact' : ''}
              >
                →
              </Button>
            </div>
          )}
        </div>
        
        {viewMode === "week" && (
          <div className={`text-right ${isAdmin ? 'text-sm' : ''}`}>
            <p className="font-medium">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM dd")} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM dd, yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* Jobs sections */}
      <div className="space-y-4">
        {renderJobsList(filteredCurrentJobs, "Current Jobs", "current", "bg-blue-50 text-blue-700 border-blue-200")}
        {renderJobsList(filteredCompletedJobs, "Completed Jobs", "completed", "bg-green-50 text-green-700 border-green-200")}
      </div>
    </div>
  );
}
