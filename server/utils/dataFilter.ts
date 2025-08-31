import { Job } from "@shared/types";

/**
 * Filter job data based on user role and job status
 * For staff users: remove client details from completed jobs, keep only MEO number and duration
 */
export function filterJobsForUser(jobs: Job[], userRole: string): Job[] {
  if (userRole !== 'staff') {
    return jobs; // Admin and Apollo users see full data
  }

  return jobs.map(job => {
    // For completed jobs, staff users only see MEO number and duration
    if (job.status === 'completed') {
      return {
        ...job,
        // Keep essential job info
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        priority: job.priority,
        assignedTo: job.assignedTo,
        dueDate: job.dueDate,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        duration: job.duration,
        meoJobNumber: job.meoJobNumber,
        category: job.category,
        
        // Remove client-sensitive information for completed jobs
        insuredName: undefined,
        claimNo: undefined,
        policyNo: undefined,
        riskAddress: undefined,
        insEmail: undefined,
        insCell: undefined,
        underwriter: undefined,
        broker: undefined,
        excess: undefined,
        incidentDate: undefined,
        descriptionOfLoss: undefined,
        
        // Keep work-related info but remove sensitive details
        notes: job.notes ? "Work completed" : undefined,
        photos: [], // Remove photos for privacy
      } as Job;
    }
    
    // For non-completed jobs, staff users see all data (they need it to do their work)
    return job;
  });
}

/**
 * Filter form submissions for staff users
 * Remove sensitive client data from completed job submissions
 */
export function filterFormSubmissionsForUser(submissions: any[], jobs: Job[], userRole: string): any[] {
  if (userRole !== 'staff') {
    return submissions; // Admin and Apollo users see full data
  }

  return submissions.map(submission => {
    const relatedJob = jobs.find(job => job.id === submission.jobId);
    
    // If the related job is completed, filter out sensitive client data
    if (relatedJob && relatedJob.status === 'completed') {
      const filteredData = { ...submission.formData };
      
      // Remove common client-sensitive fields
      delete filteredData.insuredName;
      delete filteredData.claimNumber;
      delete filteredData.policyNumber;
      delete filteredData.clientEmail;
      delete filteredData.clientPhone;
      delete filteredData.clientAddress;
      delete filteredData.excess;
      delete filteredData.underwriter;
      delete filteredData.broker;
      
      return {
        ...submission,
        formData: filteredData,
        // Keep MEO number and basic job info
        jobDetails: {
          meoJobNumber: relatedJob.meoJobNumber,
          duration: relatedJob.duration,
          status: relatedJob.status,
        }
      };
    }
    
    // For non-completed jobs, staff see all data
    return submission;
  });
}

/**
 * Log data access for security monitoring
 */
export function logDataAccess(userId: string, userRole: string, dataType: string, recordCount: number) {
  console.log(`📊 DATA ACCESS: User ${userId} (${userRole}) accessed ${recordCount} ${dataType} records`);
  
  // Log suspicious access patterns
  if (recordCount > 100 && userRole === 'staff') {
    console.warn(`🚨 UNUSUAL ACCESS: Staff user ${userId} accessed ${recordCount} ${dataType} records (large dataset)`);
  }
}
