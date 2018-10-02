# odata-data-source

Data source for material table and angular cdk table that can work with odata version 4 api. It supports sorting with MatSort and pagination with MatPaginator as well as per column filtering.

## Getting started

#### 1. Install odata-data-source:

```bash
npm install --save odata-data-source @angular/cdk odata-query
```

#### 2. Import http client module:

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app';

@NgModule({
  ...
  imports: [
    ...

    HttpClientModule
  ],
})
export class AppModule {}
```

#### 4. Initialize ODataDataSource in your component with http client and resource path:

```ts
import { HttpClient } from '@angular/common/http';

constructor(private readonly httpClient: HttpClient) {}

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
})
export class AppComponent {

  const resourcePath = 'https://services.odata.org/V4/OData/OData.svc/Products';
  this.dataSource = new ODataDataSource(this.httpClient, resourcePath);

}
```

#### 5. Use the data source for material or cdk table with column templates matching data

```html
<table cdk-table [dataSource]="dataSource">
    ...
</table>
```

## Further info

#### API reference for odata-data-source

##### Properties

| Name         | Description                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------|
| selectedFields: string[]  | Properties to select from the odata api                                                 |
| sort: MatSort             | Instance of the MatSort directive used by the table to control its sorting. Sort changes emitted by the MatSort will trigger a request to get data from the api.                                               |
| paginator: MatPaginator   | Instance of the MatPaginator component used by the table to control what page of the data is displayed. Page changes emitted by the MatPaginator will trigger a request to get data from the api.          |
| filters: ODataFilter[]    | Array of filters that implement ODataFilter interface. Setting filters will trigger a request to get data from the api                                                                                      |


#### ODataFilter

ODataFilter has getFilter() method which needs to return an object that conforms to [odata-query](https://www.npmjs.com/package/odata-query#filtering) filter definition