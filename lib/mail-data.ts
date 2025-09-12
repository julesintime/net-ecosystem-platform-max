export const mails = [
  {
    id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
    name: "William Smith",
    email: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    text: `Hi team,

Just a reminder about our meeting tomorrow at 10 AM in Conference Room B.

Please come prepared with your project updates and any questions you might have. We'll be discussing the Q4 roadmap and resource allocation.

Also, don't forget to bring your laptops as we'll be doing some collaborative planning.

Looking forward to seeing everyone there!

Best regards,
William`,
    date: "2023-10-22T09:00:00",
    read: true,
    labels: ["meeting", "work"]
  },
  {
    id: "110e8400-e29b-11d4-a716-446655440000",
    name: "Alice Smith",
    email: "alicesmith@example.com", 
    subject: "Re: Project Update",
    text: `Hi William,

Thanks for the update on the project. The progress looks great so far, and I'm particularly impressed with the new dashboard functionality.

A few quick questions:
1. Are we still on track for the December release?
2. Do we need additional testing resources?
3. How are the performance metrics looking?

Let's schedule a call this week to discuss the next steps in detail.

Best,
Alice`,
    date: "2023-10-21T14:30:00",
    read: true,
    labels: ["work", "update"]
  },
  {
    id: "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
    name: "Bob Johnson", 
    email: "bobjohnson@example.com",
    subject: "Weekend Plans",
    text: `Hey everyone!

I'm thinking of organizing a team outing this weekend. We could either go for a hiking trip in the nearby mountains or have a beach day if the weather's nice.

What do you think? I'm putting together a quick poll to see what everyone prefers. We can also do something else entirely if you have other suggestions.

Let me know your thoughts by Thursday so I can make the reservations.

Cheers,
Bob`,
    date: "2023-10-20T16:45:00",
    read: false,
    labels: ["personal", "team"]
  },
  {
    id: "61c35085-72d7-42d0-8179-0294394af79a",
    name: "Emily Davis",
    email: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    text: `Hi Sarah,

I've reviewed the budget numbers you sent over, and I have a few concerns about the Q1 allocation.

The marketing budget seems quite high compared to previous quarters, and I'm wondering if we've accounted for the seasonal variations in our industry.

Could we set up a quick call to discuss some potential adjustments? I have some ideas that might help us optimize the spend while maintaining our growth targets.

I'm free Wednesday afternoon or Friday morning if that works for you.

Best regards,
Emily`,
    date: "2023-10-19T11:15:00",
    read: false,
    labels: ["work", "budget"]
  },
  {
    id: "8f7b5c2d-4e3a-4b9c-8f2a-1b3c4d5e6f7g",
    name: "Michael Wilson",
    email: "michaelwilson@example.com",
    subject: "Important Announcement",
    text: `Dear Team,

I'm excited to share some important news about our company's direction for the next year.

Please join us for an all-hands meeting this Friday at 3 PM in the main auditorium. We'll be discussing:

• Our Q4 results and achievements
• New product launches for next year  
• Organizational changes and new opportunities
• Updated benefits and compensation packages

Light refreshments will be provided, and there will be time for Q&A at the end.

This is a mandatory meeting for all full-time employees. Remote team members can join via the usual video conference link.

Looking forward to sharing this exciting news with everyone!

Best,
Michael Wilson
CEO`,
    date: "2023-10-18T08:00:00",
    read: true,
    labels: ["important", "company"]
  },
  {
    id: "9a8b7c6d-5e4f-1a2b-3c4d-5e6f7a8b9c0d",
    name: "Sarah Connor",
    email: "sarahconnor@example.com",
    subject: "Security Protocol Update",
    text: `Team,

I need to inform you about some important changes to our security protocols that will take effect next Monday.

Key changes include:
• Two-factor authentication will be mandatory for all accounts
• VPN access requirements for remote work
• New password complexity requirements
• Quarterly security training sessions

Please make sure to update your credentials before the deadline. IT support will be available all week to help with any issues.

Stay vigilant,
Sarah`,
    date: "2023-10-17T13:20:00",
    read: false,
    labels: ["security", "important"]
  },
  {
    id: "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
    name: "David Kim",
    email: "davidkim@example.com",
    subject: "Code Review Request",
    text: `Hi there,

Could you please review my latest pull request when you get a chance? It's for the user authentication module refactor.

The PR includes:
- Cleaner separation of concerns
- Better error handling
- Updated unit tests
- Documentation improvements

I'd appreciate your feedback, especially on the error handling approach. Let me know if you spot any issues or have suggestions for improvement.

Thanks!
David`,
    date: "2023-10-16T10:45:00",
    read: true,
    labels: ["development", "review"]
  },
  {
    id: "2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
    name: "Lisa Martinez",
    email: "lisamartinez@example.com",
    subject: "Marketing Campaign Results",
    text: `Hello team,

I'm pleased to share the results from our recent marketing campaign. The numbers exceeded our expectations across all metrics!

Highlights:
• 45% increase in website traffic
• 32% improvement in conversion rates
• 28% growth in email subscribers
• 156% ROI on ad spend

The most successful channels were social media ads and email marketing. Our content strategy focusing on educational resources really resonated with our target audience.

I'll be presenting detailed findings at next week's marketing meeting.

Best regards,
Lisa`,
    date: "2023-10-15T15:30:00",
    read: false,
    labels: ["marketing", "results"]
  },
  {
    id: "3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
    name: "James Thompson",
    email: "jamesthompson@example.com",
    subject: "Database Maintenance Window",
    text: `All,

We have scheduled database maintenance for this Sunday from 2:00 AM to 6:00 AM EST.

During this time:
- All services will be temporarily unavailable
- Automatic backups will be performed
- Performance optimizations will be applied
- Security patches will be installed

We don't anticipate any issues, but please plan accordingly if you have any weekend work scheduled.

If you encounter any problems after the maintenance, please contact the on-call engineer immediately.

James
Database Administrator`,
    date: "2023-10-14T09:15:00",
    read: true,
    labels: ["maintenance", "database"]
  },
  {
    id: "4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
    name: "Rachel Green",
    email: "rachelgreen@example.com",
    subject: "New Team Member Introduction",
    text: `Hi everyone,

I'm excited to introduce our newest team member, Alex Johnson, who will be joining us as a Senior Software Engineer starting Monday.

Alex comes to us with 8 years of experience in full-stack development, with particular expertise in React, Node.js, and cloud architecture. Most recently, Alex worked at TechCorp where they led the development of their customer portal.

Alex will be working primarily with the platform team on our upcoming microservices migration. Please join me in giving them a warm welcome!

Looking forward to having Alex on board.

Best,
Rachel
HR Director`,
    date: "2023-10-13T11:00:00",
    read: false,
    labels: ["hr", "team"]
  },
  {
    id: "5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c",
    name: "Tom Anderson",
    email: "tomanderson@example.com",
    subject: "Client Meeting Follow-up",
    text: `Team,

Following up on yesterday's client meeting with GlobalTech. Overall, it went very well and they seem excited about our proposal.

Key takeaways:
- They're interested in a 12-month contract
- Budget is approved for Phase 1 ($75K)
- Timeline is aggressive but doable
- They want to see a detailed project plan by next week

Action items:
1. Prepare detailed project timeline (Due: Friday)
2. Resource allocation planning (Due: Monday) 
3. Risk assessment document (Due: Tuesday)
4. Contract review with legal (Due: Wednesday)

Let's schedule a team meeting tomorrow to discuss next steps and assign responsibilities.

Tom`,
    date: "2023-10-12T16:20:00",
    read: true,
    labels: ["client", "project"]
  },
  {
    id: "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
    name: "Maria Rodriguez",
    email: "mariarodriguez@example.com",
    subject: "Office Holiday Party Planning",
    text: `Hello everyone!

It's that time of year again - time to start planning our annual holiday party! 🎉

I'm putting together a planning committee and would love some volunteers. We need help with:
- Venue selection and booking
- Menu planning and catering
- Entertainment and activities
- Decorations and setup
- Photography and memories

The party is tentatively scheduled for December 15th. Last year was such a success, so let's make this year even better!

If you're interested in helping or have any suggestions, please let me know by next Friday.

Thanks!
Maria
Office Manager`,
    date: "2023-10-11T14:10:00",
    read: false,
    labels: ["social", "planning"]
  },
  {
    id: "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
    name: "Kevin Chen",
    email: "kevinchen@example.com",
    subject: "Performance Review Schedule",
    text: `Hi team,

It's time for our quarterly performance reviews! I've scheduled individual meetings with each team member over the next two weeks.

Your review will cover:
• Goal achievement and progress
• Skills development and growth
• Feedback on current projects
• Career development planning
• Any concerns or suggestions

Please prepare by:
1. Reviewing your quarterly goals
2. Gathering examples of your achievements
3. Thinking about areas for improvement
4. Considering your career aspirations

I'll send individual meeting invitations by tomorrow. If you have any scheduling conflicts, please let me know ASAP.

Looking forward to our discussions!

Kevin
Engineering Manager`,
    date: "2023-10-10T12:45:00",
    read: true,
    labels: ["review", "management"]
  },
  {
    id: "8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    name: "Amanda Foster",
    email: "amandafoster@example.com",
    subject: "New Office Equipment Arrived",
    text: `Everyone,

Great news! The new office equipment we ordered has finally arrived and is being set up today.

What's new:
- 4K monitors for all developers
- Ergonomic standing desks (adjustable height)
- New conference room AV system
- Updated laptops for the design team
- Improved WiFi access points

The IT team will be doing installations throughout the week. They'll coordinate with each person individually to minimize disruption to your work.

If you have any questions about the new equipment or need help with setup, please reach out to our IT helpdesk.

Amanda
Operations Manager`,
    date: "2023-10-09T10:30:00",
    read: false,
    labels: ["equipment", "office"]
  },
  {
    id: "9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a",
    name: "Steve Williams",
    email: "stevewilliams@example.com",
    subject: "Quarterly Financial Report",
    text: `Leadership Team,

Please find attached our Q3 financial report. Overall performance has been strong with several key achievements.

Financial Highlights:
• Revenue: $2.4M (18% increase YoY)
• Profit Margin: 23% (up from 19% last quarter)
• Operating Expenses: Well within budget
• Cash Flow: Healthy and stable

Key Drivers:
- Strong performance from enterprise sales
- Successful cost optimization initiatives  
- New customer acquisition exceeded targets
- High customer retention rate (94%)

Looking ahead to Q4, we're well-positioned to meet our annual targets. I'll present detailed findings at the board meeting next week.

Let me know if you have any questions.

Steve
CFO`,
    date: "2023-10-08T08:45:00",
    read: true,
    labels: ["finance", "quarterly"]
  }
]