import {
  ANIMATION_DURATION,
  STAGGER_DELAY,
  SPRING_CONFIG,
  SCALE,
  TRANSLATE,
} from '@/src/utils/animations';

describe('ANIMATION_DURATION', () => {
  it('has all expected duration keys', () => {
    expect(ANIMATION_DURATION).toEqual(
      expect.objectContaining({
        screenEntrance: expect.any(Number),
        cardEntrance: expect.any(Number),
        exit: expect.any(Number),
        screenTransition: expect.any(Number),
        modalTransition: expect.any(Number),
        fadeTransition: expect.any(Number),
        pressRelease: expect.any(Number),
      }),
    );
  });

  it('all values are positive', () => {
    for (const value of Object.values(ANIMATION_DURATION)) {
      expect(value).toBeGreaterThan(0);
    }
  });

  it('exit is shorter than entrance durations', () => {
    expect(ANIMATION_DURATION.exit).toBeLessThan(ANIMATION_DURATION.screenEntrance);
    expect(ANIMATION_DURATION.exit).toBeLessThan(ANIMATION_DURATION.cardEntrance);
  });
});

describe('STAGGER_DELAY', () => {
  it('has all expected keys with positive values', () => {
    expect(STAGGER_DELAY.listItem).toBeGreaterThan(0);
    expect(STAGGER_DELAY.section).toBeGreaterThan(0);
    expect(STAGGER_DELAY.initialOffset).toBeGreaterThan(0);
  });

  it('initialOffset is larger than listItem and section', () => {
    expect(STAGGER_DELAY.initialOffset).toBeGreaterThan(STAGGER_DELAY.listItem);
    expect(STAGGER_DELAY.initialOffset).toBeGreaterThan(STAGGER_DELAY.section);
  });
});

describe('SPRING_CONFIG', () => {
  const configs = ['pressIn', 'pressOut', 'bounce', 'entrance', 'tabIcon', 'celebration'] as const;

  it.each(configs)('%s has damping and stiffness', (key) => {
    const config = SPRING_CONFIG[key];
    expect(config.damping).toBeGreaterThan(0);
    expect(config.stiffness).toBeGreaterThan(0);
  });
});

describe('SCALE', () => {
  it('all scale values are in (0, 2) range', () => {
    for (const value of Object.values(SCALE)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(2);
    }
  });

  it('press-in scales are less than 1 (shrink effect)', () => {
    expect(SCALE.cardPressIn).toBeLessThan(1);
    expect(SCALE.buttonPressIn).toBeLessThan(1);
    expect(SCALE.quickActionPressIn).toBeLessThan(1);
    expect(SCALE.settingRow).toBeLessThan(1);
  });

  it('tabIconFocused is larger than tabIconUnfocused', () => {
    expect(SCALE.tabIconFocused).toBeGreaterThan(SCALE.tabIconUnfocused);
  });
});

describe('TRANSLATE', () => {
  it('cardEntranceY is a positive number', () => {
    expect(TRANSLATE.cardEntranceY).toBeGreaterThan(0);
  });
});
