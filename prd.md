**Title**
CamTrap Field Ops App

**Overview**
A Progressive Web App (PWA) designed to support field technicians in deploying, maintaining, and retrieving camera traps. The app facilitates both predefined and ad-hoc deployments, ensuring accurate field data collection, offline operation, and seamless synchronization with a Supabase backend. The app is mobile-first, optimized for use on smartphones and tablets in remote field conditions. Built with Next.js and deployed on Vercel, it uses Supabase for database storage and authentication.

**Problem Statement**
Field operations for camera trap deployments are often hindered by fragmented data collection methods, lack of real-time GPS tagging, and difficulty syncing data collected offline. This can lead to lost data, inefficient workflows, and difficulty maintaining consistent records across projects.

**Goals & Success Metrics**

* Streamline deployment and maintenance workflows for field technicians
* Ensure reliable offline data capture and later sync with Supabase backend
* Reduce data errors through structured input and integrated GPS/photo capture
* Achieve >95% data completeness across all recorded deployments and visits
* Reduce average field operation time per camera by 20%

**User Personas**

* *Field Technician*: Responsible for deploying, checking, and collecting camera traps in various terrains.
* *Project Coordinator*: Oversees deployment status, ensures data consistency, and monitors project progress via Supabase dashboard or connected tools.

**Proposed Features**

1. **Deployment Mode**

   * Select predefined location or create ad-hoc deployment
   * Record metadata: camera ID, deployment type, notes
   * Auto-capture GPS coordinates
   * Take photos of deployed camera

2. **Maintenance Visit Logging**

   * Select active deployment from list or map
   * Record checks: camera status, battery level, SD card status
   * Log actions: card change, battery change, issues
   * Add timestamp, GPS, and photos
   * Record created\_by (user logged into the account)

3. **Collection Mode**

   * Mark camera as collected
   * Record condition and any issues
   * Capture GPS and photo

4. **Offline Capability**

   * Fully functional offline with local storage
   * Sync with Supabase when online

5. **Integration**

   * Use Supabase to manage project data, logs, media, and user authentication
   * Auto-update deployment statuses

6. **Recording Gaps Logging**

   * Log gaps in recording due to issues like dead batteries, full SD cards, or camera left off
   * Include estimated start/end time, reason, and optional photo
   * Collected during maintenance or collection workflow

7. **Camera Timeline Viewer**

   * Visual mobile-first timeline per camera
   * Show active and inactive periods with reason if known
   * Display maintenance visits and optionally media density
   * Helps with QA and operational oversight

**User Flows or Wireframes**
Available upon request.

**Dependencies**

* Supabase (database and authentication)
* Device camera and GPS permissions
* Local storage and sync logic
* Vercel (deployment platform)

**Risks and Assumptions**

* Assumes regular internet access for sync (e.g., daily or weekly)
* Relies on device hardware capabilities (GPS, camera)
* Field conditions may impact data capture (e.g., GPS signal loss)

**Out of Scope**

* Full camera trap image review or analysis
* User account management (assumes pre-authenticated access or simple login)

**Timeline**
Available upon request (dependent on field season and dev resources)
