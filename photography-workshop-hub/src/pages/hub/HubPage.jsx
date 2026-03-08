import { Link } from 'react-router-dom';

const apps = [
  {
    name: 'Compare Workshop',
    description: 'Compare and review workshop photos in one workflow.',
    useCase:
      'Use this app to upload workshop photos, compare picks, and generate one final listing for delivery/export.',
    path: '/apps/compare-workshop'
  },
  {
    name: 'Selection Workshop',
    description: 'Build and manage workshop selection flows.',
    useCase: 'Use this app to create selection logic and shortlist handling for workshop sessions.',
    path: '/apps/selection-workshop'
  },
  {
    name: 'DISC Analysis workshop',
    description: 'Run DISC analysis workflows for workshop participants.',
    useCase: 'Use this app to track DISC analysis steps and compile participant outcomes.',
    path: '/apps/disc-analysis-workshop'
  }
];

function HubPage() {
  return (
    <section>
      <h2>Hub</h2>
      <p>Choose an app to build your workshop.</p>

      <div className="card-grid">
        {apps.map((app) => (
          <article key={app.path} className="card">
            <h3>{app.name}</h3>
            <p className="card-description">{app.description}</p>
            <p className="card-info">{app.useCase}</p>

            <Link to={app.path} className="open-app-link">
              Open app
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HubPage;
