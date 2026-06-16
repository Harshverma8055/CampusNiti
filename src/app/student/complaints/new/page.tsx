import ComplaintForm from '@/components/complaints/ComplaintForm';

export const metadata = {
    title: 'Report Campus Issue — CampusNiti',
    description: 'Report a campus infrastructure or maintenance issue at NIT Jalandhar.',
};

export default function NewComplaintPage() {
    return (
        <div>
            <div className="page-header">
                <h1>Report a Campus Issue 🏗️</h1>
                <p>Fill in the details below. Your report will be reviewed by the admin and assigned to maintenance staff.</p>
            </div>
            <ComplaintForm />
        </div>
    );
}
