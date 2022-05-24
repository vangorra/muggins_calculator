import './global-mocks/match-media.mock';
import './global-mocks/computed-style.mock';
import './global-mocks/worker.mock';

// Globally mock worker URLs.
jest.mock('./app/solver/solver-calculate-worker-factory');
jest.mock('./app/solver/solver-common-worker-factory');
