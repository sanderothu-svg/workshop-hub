import { Link } from 'react-router-dom';

const apps = [
  {
    name: 'Compare Workshop',
    description: 'Compare, review, and star photos.',
    useCase:
      'Use this app to run workshops with multiple photographers, compare images, and generate a final shortlist of the best photos. You can also review selections by photographer during the workshop.',
    path: '/apps/compare-workshop'
  },
  {
    name: 'Selection Workshop',
    description: 'Photo selection in multiple steps.',
    useCase:
      'Use this app to improve the selection process and avoid over-delivering photos. Start by uploading a batch, then configure two selection rounds and set the target number of final images.',
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
