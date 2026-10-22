import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Official from '../models/Official.js';
import Petitioner from '../models/Petitioner.js';
import Grievance from '../models/Grievance.js';
import Notification from '../models/Notification.js';

// Demo accounts created on an empty database (local/offline demo).
// Change these passwords before using a shared database.
export const DEMO_ACCOUNTS = {
    admin: { adminId: 'ADM001', email: 'admin@example.com', password: 'Admin@123' },
    petitioner: { email: 'petitioner@example.com', password: 'Petitioner@123' },
    officialPassword: 'Official@123'
};

const JURISDICTIONS = [
    { district: 'Chennai', division: 'Chennai Central', taluk: 'Egmore', pincode: '600008' },
    { district: 'Chennai', division: 'Chennai South', taluk: 'Adyar', pincode: '600020' }
];

const DEPARTMENTS = ['Water', 'RTO', 'Electricity'];

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const seedDatabase = async () => {
    if (process.env.SEED_DEMO_DATA === 'false') return;

    const hasData = await Admin.exists({}) || await Official.exists({}) || await Petitioner.exists({});
    if (hasData) return;

    console.log('Empty database detected - seeding demo data...');

    const admin = await Admin.create({
        firstName: 'State',
        lastName: 'Administrator',
        email: DEMO_ACCOUNTS.admin.email,
        phone: '9000000001',
        adminId: DEMO_ACCOUNTS.admin.adminId,
        position: 'Grievance Cell Head',
        password: await bcrypt.hash(DEMO_ACCOUNTS.admin.password, 10)
    });

    const officialHash = await bcrypt.hash(DEMO_ACCOUNTS.officialPassword, 10);
    const officials = {};
    let phoneSuffix = 10;
    for (const department of DEPARTMENTS) {
        for (const j of JURISDICTIONS) {
            const official = await Official.create({
                firstName: department === 'RTO' ? 'RTO' : department,
                lastName: `Officer ${j.taluk}`,
                email: `${department.toLowerCase()}.${j.taluk.toLowerCase()}@example.com`,
                phone: `90000000${phoneSuffix++}`,
                employeeId: `${department.toUpperCase().slice(0, 3)}-${j.taluk.slice(0, 3).toUpperCase()}-01`,
                department,
                designation: 'Assistant Engineer',
                officeAddress: `${department} Office, ${j.taluk}`,
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: j.pincode,
                taluk: j.taluk,
                district: j.district,
                division: j.division,
                password: officialHash
            });
            officials[`${department}:${j.taluk}`] = official;
        }
    }

    const petitionerHash = await bcrypt.hash(DEMO_ACCOUNTS.petitioner.password, 10);
    const petitioner = await Petitioner.create({
        firstName: 'Kavya',
        lastName: 'Raman',
        email: DEMO_ACCOUNTS.petitioner.email,
        phone: '9000000101',
        address: '12, Pantheon Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600008',
        password: petitionerHash
    });
    const petitioner2 = await Petitioner.create({
        firstName: 'Arun',
        lastName: 'Kumar',
        email: 'arun@example.com',
        phone: '9000000102',
        address: '4, LB Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600020',
        password: petitionerHash
    });

    const history = (status, by, byType, comment, date) => ({ status, updatedBy: by, updatedByType: byType, comment, timestamp: date });

    const waterEgmore = officials['Water:Egmore'];
    const elecAdyar = officials['Electricity:Adyar'];
    const rtoEgmore = officials['RTO:Egmore'];
    const waterAdyar = officials['Water:Adyar'];

    const grievances = [
        {
            petitionId: 'GRV100001',
            title: 'Contaminated drinking water in Pantheon Road',
            description: 'Drinking water supplied in our street has been muddy and smells of sewage for 4 days. Several children have fallen sick. Please fix the contamination urgently.',
            department: 'Water', ...JURISDICTIONS[0], location: 'Pantheon Road, Egmore',
            petitioner: petitioner._id, assignedOfficials: [waterEgmore._id],
            status: 'pending', priority: 'High',
            priorityExplanation: 'Health hazard from contaminated drinking water.',
            impactAssessment: 'High impact on public health in the locality.',
            recommendedResponseTime: '24 hours',
            createdAt: daysAgo(1),
            statusHistory: [history('pending', petitioner._id, 'petitioner', 'Grievance submitted', daysAgo(1))]
        },
        {
            petitionId: 'GRV100002',
            title: 'Sewage mixing with drinking water near Egmore station',
            description: 'Drinking water in our street smells of sewage and looks muddy. Residents are falling sick due to the contamination.',
            department: 'Water', ...JURISDICTIONS[0], location: 'Gandhi Irwin Road, Egmore',
            petitioner: petitioner2._id, assignedOfficials: [waterEgmore._id],
            status: 'pending', priority: 'High',
            priorityExplanation: 'Possible sewage contamination of drinking water.',
            impactAssessment: 'High impact on public health.',
            recommendedResponseTime: '24 hours',
            createdAt: daysAgo(2),
            statusHistory: [history('pending', petitioner2._id, 'petitioner', 'Grievance submitted', daysAgo(2))]
        },
        {
            petitionId: 'GRV100003',
            title: 'Low water pressure in apartment block',
            description: 'Water pressure has been very low for two weeks in Egmore High Road apartments. The overhead tank does not fill.',
            department: 'Water', ...JURISDICTIONS[0], location: 'Egmore High Road',
            petitioner: petitioner._id, assignedTo: waterEgmore._id, assignedOfficials: [waterEgmore._id],
            status: 'in-progress', priority: 'Medium',
            priorityExplanation: 'Service disruption, not life threatening.',
            impactAssessment: 'Moderate impact on water services.',
            recommendedResponseTime: '3-5 working days',
            createdAt: daysAgo(20),
            resourceManagement: {
                startDate: daysAgo(15), endDate: daysAgo(-5),
                requirementsNeeded: 'Replace faulty valve on the feeder main',
                fundsRequired: 85000, resourcesRequired: 'Valve, pipe fittings, excavation tools',
                manpowerNeeded: 6, ...JURISDICTIONS[0]
            },
            timelineStages: [
                { stageName: 'Under Review', date: daysAgo(18), description: 'Site inspection scheduled' },
                { stageName: 'Investigation', date: daysAgo(14), description: 'Faulty valve identified on the feeder main' }
            ],
            statusHistory: [
                history('pending', petitioner._id, 'petitioner', 'Grievance submitted', daysAgo(20)),
                history('assigned', waterEgmore._id, 'official', 'Grievance accepted', daysAgo(19)),
                history('in-progress', waterEgmore._id, 'official', 'Resource management details added and work started', daysAgo(15))
            ],
            chatMessages: [
                { sender: petitioner._id, senderType: 'Petitioner', message: 'Any update on the pressure issue?', timestamp: daysAgo(10) },
                { sender: waterEgmore._id, senderType: 'Official', message: 'The faulty valve has been identified. Replacement work starts this week.', timestamp: daysAgo(9) }
            ]
        },
        {
            petitionId: 'GRV100004',
            title: 'Transformer sparking near school',
            description: 'The transformer near the corporation school in Adyar is sparking every evening. There is a live wire hanging low. This is a safety hazard for students.',
            department: 'Electricity', ...JURISDICTIONS[1], location: 'LB Road, Adyar',
            petitioner: petitioner2._id, assignedTo: elecAdyar._id, assignedOfficials: [elecAdyar._id],
            status: 'assigned', priority: 'High',
            priorityExplanation: 'Live wire and sparking near a school.',
            impactAssessment: 'High impact on public safety.',
            recommendedResponseTime: '24 hours',
            createdAt: daysAgo(4),
            statusHistory: [
                history('pending', petitioner2._id, 'petitioner', 'Grievance submitted', daysAgo(4)),
                history('assigned', elecAdyar._id, 'official', 'Grievance accepted', daysAgo(3))
            ],
            isEscalated: true, escalatedAt: daysAgo(1), escalatedBy: petitioner2._id,
            escalationReason: 'High priority grievance not resolved within 48 hours',
            escalationStatus: 'Pending'
        },
        {
            petitionId: 'GRV100005',
            title: 'Driving licence renewal pending for 2 months',
            description: 'I applied for licence renewal at Egmore RTO two months ago. The application status still shows pending verification.',
            department: 'RTO', ...JURISDICTIONS[0], location: 'Egmore RTO',
            petitioner: petitioner._id, assignedTo: rtoEgmore._id, assignedOfficials: [rtoEgmore._id],
            status: 'resolved', priority: 'Low',
            priorityExplanation: 'Routine administrative request.',
            impactAssessment: 'Limited impact on services.',
            recommendedResponseTime: '7-10 working days',
            createdAt: daysAgo(60),
            resolution: { text: 'Licence renewed and dispatched by post.', date: daysAgo(50) },
            feedback: { rating: 4, comment: 'Resolved after follow-up. Thank you.', date: daysAgo(49) },
            timelineStages: [
                { stageName: 'Under Review', date: daysAgo(58), description: 'Application located and verified' },
                { stageName: 'Resolution', date: daysAgo(50), description: 'Licence renewed' }
            ],
            statusHistory: [
                history('pending', petitioner._id, 'petitioner', 'Grievance submitted', daysAgo(60)),
                history('assigned', rtoEgmore._id, 'official', 'Grievance accepted', daysAgo(59)),
                history('in-progress', rtoEgmore._id, 'official', 'Started progress', daysAgo(58)),
                history('resolved', rtoEgmore._id, 'official', 'Resolved: Licence renewed and dispatched by post.', daysAgo(50))
            ]
        },
        {
            petitionId: 'GRV100006',
            title: 'Pipe leakage flooding the street',
            description: 'A pipeline leakage on 2nd Main Road, Adyar is flooding the street and wasting water for a week.',
            department: 'Water', ...JURISDICTIONS[1], location: '2nd Main Road, Adyar',
            petitioner: petitioner2._id, assignedTo: waterAdyar._id, assignedOfficials: [waterAdyar._id],
            status: 'resolved', priority: 'Medium',
            priorityExplanation: 'Leakage causing water wastage.',
            impactAssessment: 'Moderate impact on water services.',
            recommendedResponseTime: '3-5 working days',
            createdAt: daysAgo(35),
            resourceManagement: {
                startDate: daysAgo(33), endDate: daysAgo(28),
                requirementsNeeded: 'Pipe joint replacement', fundsRequired: 40000,
                resourcesRequired: 'PVC pipe, clamps', manpowerNeeded: 4, ...JURISDICTIONS[1]
            },
            resolution: { text: 'Leak repaired and road restored.', date: daysAgo(28) },
            statusHistory: [
                history('pending', petitioner2._id, 'petitioner', 'Grievance submitted', daysAgo(35)),
                history('resolved', waterAdyar._id, 'official', 'Resolved: Leak repaired and road restored.', daysAgo(28))
            ]
        },
        {
            petitionId: 'GRV100007',
            title: 'Frequent power cuts in Adyar',
            description: 'Frequent outages and voltage fluctuation every night in Kasturba Nagar, Adyar. Appliances are getting damaged.',
            department: 'Electricity', ...JURISDICTIONS[1], location: 'Kasturba Nagar, Adyar',
            petitioner: petitioner._id, assignedOfficials: [elecAdyar._id],
            status: 'pending', priority: 'Medium',
            priorityExplanation: 'Recurring service disruption.',
            impactAssessment: 'Moderate impact on power services.',
            recommendedResponseTime: '3-5 working days',
            createdAt: daysAgo(9),
            statusHistory: [history('pending', petitioner._id, 'petitioner', 'Grievance submitted', daysAgo(9))]
        }
    ];

    const created = [];
    for (const g of grievances) {
        created.push(await Grievance.create({ portal_type: 'GRS', ...g }));
    }

    await Notification.create([
        {
            recipient: waterEgmore._id, recipientType: 'Official', type: 'NEW_GRIEVANCE',
            message: 'A new grievance has been submitted in your jurisdiction (Egmore, Chennai, Chennai Central). Please review and accept if you can handle it.',
            grievanceId: created[0]._id
        },
        {
            recipient: admin._id, recipientType: 'Admin', type: 'ESCALATION',
            message: `A case has been escalated and requires your attention. Grievance ID: ${created[3]._id}`,
            grievanceId: created[3]._id
        },
        {
            recipient: petitioner._id, recipientType: 'Petitioner', type: 'GRIEVANCE_RESOLVED',
            message: 'Your grievance (GRV100005) has been resolved.',
            grievanceId: created[4]._id, read: true
        }
    ]);

    console.log('Demo data seeded:');
    console.log(`  Admin      : ${DEMO_ACCOUNTS.admin.email} / ${DEMO_ACCOUNTS.admin.password} (Admin ID ${DEMO_ACCOUNTS.admin.adminId})`);
    console.log(`  Petitioner : ${DEMO_ACCOUNTS.petitioner.email} / ${DEMO_ACCOUNTS.petitioner.password}`);
    console.log(`  Officials  : water.egmore@example.com, rto.egmore@example.com, electricity.adyar@example.com ... / ${DEMO_ACCOUNTS.officialPassword}`);
};
