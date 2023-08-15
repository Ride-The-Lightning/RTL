import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// eslint-disable-next-line no-console
platformBrowserDynamic().bootstrapModule(AppModule).catch((err) => console.error(err));
