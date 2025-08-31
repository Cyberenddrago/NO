import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Users,
  Route,
  Sun,
  Moon,
  Navigation,
} from "lucide-react";
import { Job, User } from "@shared/types";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addWeeks,
  differenceInMinutes,
} from "date-fns";

interface ScheduleEntry {
  time: string;
  type: "base" | "job" | "travel" | "end";
  location: string;
  description: string;
  jobId?: string;
  estimatedDuration?: number;
  coordinates?: { lat: number; lng: number };
}

interface StaffScheduleManagerProps {
  jobs: Job[];
  staff: User[];
  currentUser: User;
}

const BASE_LOCATIONS = {
  Johannesburg: {
    address: "5 Thora Cres, Wynberg, Sandton, 2090",
    coordinates: { lat: -26.1076, lng: 28.0567 },
  },
  "Cape Town": {
    address: "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
    coordinates: { lat: -33.8903, lng: 18.4979 },
  },
};

export function StaffScheduleManager({
  jobs,
  staff,
  currentUser,
}: StaffScheduleManagerProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [schedules, setSchedules] = useState<Record<string, ScheduleEntry[]>>(
    {},
  );

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const isAdmin = currentUser.role === "admin";
  const isSupervisor = currentUser.role === "supervisor";

  useEffect(() => {
    // Only generate schedules if we have valid data
    if (Array.isArray(jobs) && Array.isArray(staff) && selectedWeek) {
      generateSchedules();
    }
  }, [jobs, staff, selectedWeek]);

  const generateSchedules = () => {
    const newSchedules: Record<string, ScheduleEntry[]> = {};

    // Safety check for staff data
    if (!Array.isArray(staff)) {
      console.warn('generateSchedules: Staff data is not an array', staff);
      setSchedules(newSchedules);
      return;
    }

    staff
      .filter((s) => s && s.role === "staff" && s.id)
      .forEach((staffMember) => {
        if (!staffMember.id) {
          console.warn('generateSchedules: Staff member missing ID', staffMember);
          return;
        }

        weekDays.forEach((day) => {
          if (!day) {
            console.warn('generateSchedules: Invalid day', day);
            return;
          }

          try {
            const key = `${staffMember.id}-${format(day, "yyyy-MM-dd")}`;
            newSchedules[key] = generateDaySchedule(staffMember, day);
          } catch (error) {
            console.error('generateSchedules: Error generating schedule for', staffMember.name, 'on', day, error);
            newSchedules[`${staffMember.id}-${format(day, "yyyy-MM-dd")}`] = [];
          }
        });
      });

    setSchedules(newSchedules);
  };

  const generateDaySchedule = (
    staffMember: User,
    date: Date,
  ): ScheduleEntry[] => {
    const schedule: ScheduleEntry[] = [];

    // Safety check for required parameters
    if (!staffMember || !staffMember.id || !date) {
      console.warn('generateDaySchedule: Missing required parameters', { staffMember, date });
      return schedule;
    }

    const dayJobs = jobs.filter(
      (job) =>
        job &&
        job.assignedTo === staffMember.id &&
        job.dueDate &&
        isSameDay(parseISO(job.dueDate), date),
    );

    // Sort jobs by time
    const sortedJobs = dayJobs.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const baseLocationKey = staffMember.location?.city || "Johannesburg";

    // Ensure the base location exists in our BASE_LOCATIONS, fallback to Johannesburg
    const validBaseLocation = BASE_LOCATIONS[baseLocationKey as keyof typeof BASE_LOCATIONS]
      ? baseLocationKey as keyof typeof BASE_LOCATIONS
      : "Johannesburg";

    const baseLocationData = BASE_LOCATIONS[validBaseLocation];

    const isLateShift =
      staffMember.schedule?.workingLateShift || isLateShiftWeek(date);
    const shiftEnd = isLateShift ? "19:00" : "17:00";

    // Start at base location
    schedule.push({
      time: "05:00",
      type: "base",
      location: baseLocationData.address,
      description: "Start shift at base location",
      coordinates: baseLocationData.coordinates,
    });

    let currentTime = "05:00";
    let currentLocation = baseLocationData.coordinates;

    // Add jobs and travel time
    sortedJobs.forEach((job, index) => {
      // Safety checks for job properties
      if (!job || !job.id) {
        console.warn('generateDaySchedule: Invalid job data', job);
        return;
      }

      const jobTime = job.dueDate ? format(parseISO(job.dueDate), "HH:mm") : "08:00";
      const jobLocation = job.riskAddress || job.RiskAddress || "Location not specified";
      const jobTitle = job.title || "Unnamed Job";

      // Estimate travel time (simplified - in reality would use mapping API)
      const travelTime = estimateTravelTime(currentLocation, {
        lat: -26.2041 + Math.random() * 0.1,
        lng: 28.0473 + Math.random() * 0.1,
      });

      if (travelTime > 0 && jobTime) {
        const travelStart = subtractMinutes(jobTime, travelTime);
        schedule.push({
          time: travelStart,
          type: "travel",
          location: `En route to ${jobLocation}`,
          description: `Travel time: ${travelTime} minutes`,
          estimatedDuration: travelTime,
        });
      }

      // Add job
      schedule.push({
        time: jobTime,
        type: "job",
        location: jobLocation,
        description: jobTitle,
        jobId: job.id,
        estimatedDuration: getJobDuration(job.category),
      });

      const jobDuration = getJobDuration(job.category || "Other");
      currentTime = addMinutes(jobTime, jobDuration);
      currentLocation = {
        lat: -26.2041 + Math.random() * 0.1,
        lng: 28.0473 + Math.random() * 0.1,
      };
    });

    // Add end of shift
    const lastJobTime = sortedJobs.length > 0 ? currentTime : "05:00";
    const endTime =
      compareTime(lastJobTime, shiftEnd) > 0 ? lastJobTime : shiftEnd;

    schedule.push({
      time: endTime,
      type: "end",
      location: "End of shift",
      description: `Shift ends ${isLateShift ? "(Late Shift)" : "(Normal Shift)"}`,
    });

    return schedule;
  };

  const isLateShiftWeek = (date: Date): boolean => {
    // Simplified logic - in reality would track alternating weeks
    const weekNumber = Math.floor(
      differenceInMinutes(date, new Date(2024, 0, 1)) / (7 * 24 * 60),
    );
    return weekNumber % 2 === 1;
  };

  const estimateTravelTime = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): number => {
    // Simplified distance calculation - in reality would use Google Maps API
    const distance = Math.sqrt(
      Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2),
    );
    return Math.max(15, Math.min(60, Math.round(distance * 3000))); // 15-60 minutes
  };

  const getJobDuration = (category?: string): number => {
    switch (category) {
      case "Geyser Replacement":
        return 180; // 3 hours
      case "Geyser Assessment":
        return 60; // 1 hour
      case "Leak Detection":
        return 120; // 2 hours
      case "Drain Blockage":
        return 90; // 1.5 hours
      case "Camera Inspection":
        return 75; // 1.25 hours
      case "Toilet/Shower":
        return 90; // 1.5 hours
      default:
        return 60; // 1 hour default
    }
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  };

  const subtractMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + mins - minutes;
    const newHours = Math.max(0, Math.floor(totalMinutes / 60));
    const newMins = Math.max(0, totalMinutes % 60);
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  };

  const compareTime = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  };

  const exportScheduleCSV = (staffId: string) => {
    const staffMember = Array.isArray(staff) ? staff.find((s) => s && s.id === staffId) : null;
    if (!staffMember) return;

    const headers = [
      "Date",
      "Time",
      "Type",
      "Location",
      "Description",
      "Duration (min)",
    ];
    const rows: string[] = [headers.join(",")];

    weekDays.forEach((day) => {
      const key = `${staffId}-${format(day, "yyyy-MM-dd")}`;
      const daySchedule = schedules[key] || [];

      daySchedule.forEach((entry) => {
        rows.push(
          [
            format(day, "yyyy-MM-dd"),
            entry.time,
            entry.type,
            `"${entry.location}"`,
            `"${entry.description}"`,
            entry.estimatedDuration || 0,
          ].join(","),
        );
      });
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${staffMember.name}_schedule_${format(weekStart, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getShiftTypeIcon = (staffMember: User, date: Date) => {
    const isLate =
      staffMember.schedule?.workingLateShift || isLateShiftWeek(date);
    return isLate ? (
      <Moon className="h-4 w-4 text-blue-600" />
    ) : (
      <Sun className="h-4 w-4 text-yellow-600" />
    );
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case "base":
        return <Navigation className="h-4 w-4 text-green-600" />;
      case "job":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "travel":
        return <Route className="h-4 w-4 text-orange-600" />;
      case "end":
        return <MapPin className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleLateShift = async (staffId: string) => {
    if (!isAdmin) {
      alert("Only administrators can modify staff schedules.");
      return;
    }

    // This would call an API to update staff schedule in a real implementation
    // For now, just show what would happen
    const staffMember = Array.isArray(staff) ? staff.find((s) => s && s.id === staffId) : null;
    if (staffMember) {
      console.log(`Toggling late shift for ${staffMember.name}`);
      // In real implementation: updateStaffSchedule(staffId, { workingLateShift: !staffMember.schedule?.workingLateShift });
    }
  };

  const editShiftHours = (staffId: string) => {
    if (!isAdmin) {
      alert("Only administrators can modify shift hours.");
      return;
    }

    const staffMember = Array.isArray(staff) ? staff.find((s) => s && s.id === staffId) : null;
    if (staffMember) {
      const startTime = prompt(
        `Enter start time for ${staffMember.name}:`,
        staffMember.schedule?.shiftStartTime || "05:00",
      );
      const endTime = prompt(
        `Enter end time for ${staffMember.name}:`,
        staffMember.schedule?.shiftEndTime || "17:00",
      );

      if (startTime && endTime) {
        console.log(
          `Updating ${staffMember.name} shift: ${startTime} - ${endTime}`,
        );
        // In real implementation: updateStaffSchedule(staffId, { shiftStartTime: startTime, shiftEndTime: endTime });
      }
    }
  };

  // Only show to admins and supervisors, but only admins can edit
  if (!isAdmin && !isSupervisor) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Staff Schedule Manager
            <Badge variant="outline" className="ml-2">
              Week of {format(weekStart, "MMM d, yyyy")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
              >
                Previous Week
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(new Date())}
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              >
                Next Week
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(Array.isArray(staff) ? staff : [])
              .filter((s) => s && s.role === "staff" && s.id && s.name)
              .map((staffMember) => (
                <Card key={staffMember.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">{staffMember.name}</span>
                        <Badge variant="outline">
                          {staffMember.location?.city || "Johannesburg"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportScheduleCSV(staffMember.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weekDays.map((day) => {
                        const key = `${staffMember.id}-${format(day, "yyyy-MM-dd")}`;
                        const daySchedule = schedules[key] || [];
                        const jobCount = daySchedule.filter(
                          (entry) => entry.type === "job",
                        ).length;

                        return (
                          <div
                            key={key}
                            className="border rounded-lg p-3 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                  {format(day, "EEE, MMM d")}
                                </span>
                                <div>{getShiftTypeIcon(staffMember, day)}</div>
                                <Badge variant="secondary" className="text-xs">
                                  {`${jobCount} jobs`}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-1">
                              {daySchedule.slice(0, 3).map((entry, index) => (
                                <div
                                  key={`${key}-entry-${index}`}
                                  className="flex items-center space-x-2 text-xs"
                                >
                                  <div>{getEntryIcon(entry.type)}</div>
                                  <span className="font-medium">
                                    {entry.time}
                                  </span>
                                  <span className="text-gray-600 truncate">
                                    {entry.description}
                                  </span>
                                </div>
                              ))}
                              {daySchedule.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  {`+${daySchedule.length - 3} more entries`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Moon className="h-5 w-5 mr-2" />
            Late Shift Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Johannesburg Team</h4>
              <div className="space-y-2">
                {(Array.isArray(staff) ? staff : [])
                  .filter(
                    (s) =>
                      s && s.role === "staff" && s.location?.city === "Johannesburg" && s.id && s.name,
                  )
                  .map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleLateShift(staffMember.id)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {staffMember.name}
                        </button>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <span>
                            {staffMember.schedule?.shiftStartTime || "05:00"}
                          </span>
                          <span>-</span>
                          <span>
                            {staffMember.schedule?.shiftEndTime || "17:00"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => editShiftHours(staffMember.id)}
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Badge
                        variant={
                          staffMember.schedule?.workingLateShift
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleLateShift(staffMember.id)}
                      >
                        {staffMember.schedule?.workingLateShift
                          ? "Late Shift"
                          : "Normal Shift"}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Cape Town Team</h4>
              <div className="space-y-2">
                {(Array.isArray(staff) ? staff : [])
                  .filter(
                    (s) =>
                      s && s.role === "staff" && s.location?.city === "Cape Town" && s.id && s.name,
                  )
                  .map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleLateShift(staffMember.id)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {staffMember.name}
                        </button>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <span>
                            {staffMember.schedule?.shiftStartTime || "05:00"}
                          </span>
                          <span>-</span>
                          <span>
                            {staffMember.schedule?.shiftEndTime || "17:00"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => editShiftHours(staffMember.id)}
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Badge
                        variant={
                          staffMember.schedule?.workingLateShift
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleLateShift(staffMember.id)}
                      >
                        {staffMember.schedule?.workingLateShift
                          ? "Late Shift"
                          : "Normal Shift"}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Shift System:</strong> Teams alternate weekly between
              normal (05:00-17:00) and late shifts (05:00-19:00). Late shift
              allows for extended job scheduling when needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
