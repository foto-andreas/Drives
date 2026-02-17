import { MY_DATE_FORMATS } from './app.config';

describe('MY_DATE_FORMATS', () => {
  it('should define parsing and display formats', () => {
    expect(MY_DATE_FORMATS.parse.dateInput).toBe('DD.MM.YYYY');
    expect(MY_DATE_FORMATS.display.dateInput).toBe('DD.MM.YYYY');
    expect(MY_DATE_FORMATS.display.monthYearLabel).toBe('MMM YYYY');
    expect(MY_DATE_FORMATS.display.monthYearA11yLabel).toBe('MMMM YYYY');
  });
});
