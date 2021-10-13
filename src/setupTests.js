import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';

configure({ adapter: new Adapter() });

// Add stuff that needs to run once, before all tests
beforeAll(async () => {
  await preloadAll();
});

// Add stuff that needs to run before each test
beforeEach(async () => {
  console.log('HELLO WORLD ++++++++++');
});
