import React from 'react';
import { Box, Button, Icon, Icons, Text, config, toRem } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import CinnySVG from '../../../../public/res/svg/cinny.svg';
import { CINNY_VERSION, LUMIERE_VERSION } from '../../branding/version';

export function WelcomePage() {
  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="70" height="70" src={CinnySVG} alt="Lumiere Logo" />}
            title={
              <Box as="span" alignItems="End" gap="100">
                <Text as="span" size="H2">
                  Welcome to Lumiere
                </Text>
                <Text
                  as="a"
                  size="T200"
                  href="https://github.com/mocki-toki/lumiere"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {`v${LUMIERE_VERSION}`}
                </Text>
              </Box>
            }
            subTitle={
              <span>
                A Cinny fork with improvements.{' '}
                <a
                  href="https://github.com/cinnyapp/cinny"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {`Based on Cinny ${CINNY_VERSION}`}
                </a>
              </span>
            }
          >
            <Box justifyContent="Center">
              <Box grow="Yes" style={{ maxWidth: toRem(300) }} direction="Column" gap="300">
                <Button
                  as="a"
                  href="https://github.com/mocki-toki/lumiere"
                  target="_blank"
                  rel="noreferrer noopener"
                  before={<Icon size="200" src={Icons.Code} />}
                >
                  <Text as="span" size="B400" truncate>
                    Source Code
                  </Text>
                </Button>
                <Button
                  as="a"
                  href="https://github.com/mocki-toki/lumiere"
                  target="_blank"
                  rel="noreferrer noopener"
                  fill="Soft"
                  before={<Icon size="200" src={Icons.Heart} />}
                >
                  <Text as="span" size="B400" truncate>
                    Project
                  </Text>
                </Button>
              </Box>
            </Box>
          </PageHero>
        </PageHeroSection>
      </Box>
    </Page>
  );
}
