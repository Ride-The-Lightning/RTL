import { SessionService } from './session.service';

// Each SessionService stands for one tab. The tabs of a test page share one sessionStorage, so
// a tab's token is what the receiving tab wrote there.
describe('SessionService', () => {
  const tabs: SessionService[] = [];
  const openTab = () => {
    const tab = new SessionService();
    tabs.push(tab);
    return tab;
  };
  const delivered = () => new Promise((resolve) => { setTimeout(resolve, 50); });

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    tabs.splice(0).forEach((tab) => tab.ngOnDestroy());
    sessionStorage.clear();
  });

  it('hands a shared token to the other logged-in tabs of the browser', async () => {
    const changingTab = openTab();
    const otherTab = openTab();
    otherTab.setItem('token', 'old-token');
    changingTab.shareToken('new-token');
    await delivered();
    expect(otherTab.getItem('token')).toBe('new-token');
  });

  it('does not log in a tab that has no token', async () => {
    const changingTab = openTab();
    openTab();
    changingTab.shareToken('new-token');
    await delivered();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
