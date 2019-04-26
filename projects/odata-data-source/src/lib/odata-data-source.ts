import { DataSource } from '@angular/cdk/table';
import { HttpClient } from '@angular/common/http';
import { MatMultiSort, MatPaginator } from '@angular/material';
import { Observable, of as observableOf, merge, BehaviorSubject, ObservableInput, ReplaySubject, Subscription } from 'rxjs';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import buildQuery from 'odata-query';
import { ODataFilter } from './odata-filter';

export class ODataDataSource extends DataSource<any> {

  sort: MatMultiSort;
  paginator: MatPaginator;
  selectedFields: string[];
  initialSort: string[];

  protected readonly filtersSubject = new BehaviorSubject<ODataFilter[]>(null);

  protected subscription: Subscription;
  protected readonly dataSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
  protected readonly errorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly resourcePath: string) {
      super();      
  }

  private createObservablePipe(): Observable<any> {
    const observable = this.getObservable();

    return observable.pipe(
      switchMap(() => {
        let page = 0;
        if (this.paginator) {
          page = this.paginator.pageIndex;
        }

        let sortBy = [];
        let sortOrder = null;
        if (this.sort) {
          sortBy = this.sort.active;
          sortOrder = this.sort.direction;
        }

        const result = this.getData(page, sortBy, sortOrder, this.filtersSubject.value);
        
        return result.pipe(
          tap(() => {
            if (this.errorSubject.value != null) {
              this.errorSubject.next(null);
            }
          }),
          catchError(error => {
          this.errorSubject.next(error);
          return observableOf({ data: [] }, );
        }));
      }),
      tap(result => {
        if (this.paginator) {
          this.paginator.length = result['@odata.count'];
        }
      }),
      map(this.mapResult)
    );
  }  
  
  private getObservable() {
    const toObserve = [this.filtersSubject] as Array<ObservableInput<any>>;

    if (this.paginator) {
      toObserve.push(this.paginator.page);
    }
    if (this.sort) {
      toObserve.push(this.sort.sortChange);
    }

    return merge(...toObserve);
  }

  connect(): Observable<any> {
    if (!this.subscription || this.subscription.closed) {
      this.subscription = this.createObservablePipe().subscribe(result => this.dataSubject.next(result));
    }

    return this.dataSubject.asObservable();    
  }

  disconnect(): void {
    if (this.subscription && this.dataSubject.observers.length === 0) {
      this.subscription.unsubscribe();
    }
  }

  get errors() {
    return this.errorSubject.asObservable();
  }

  getData(page: number, sortBy: string[], order: {}, filters: ODataFilter[]): Observable<object> {
    let url = this.resourcePath;
    const query = {} as any;

    if (this.paginator) {
      const perPage = this.paginator.pageSize;
      query.top = perPage;
      query.skip = perPage * page;
      query.count = true;
    }

    if (this.selectedFields) {
      query.select = this.selectedFields;
    }

    if (sortBy && sortBy.length && order) {
      query.orderBy = sortBy.map(s => {
        if (order[s] === 'asc') {
          return s;
        } else if (order[s] === 'desc') {
          return `${s} desc`;
        }
      });
    } else if (this.initialSort && this.initialSort.length) {
      query.orderBy = this.initialSort;
    }

    if (filters) {
      const filterQuery = { and: [] };
      filters.forEach(filter => {
        filterQuery.and.push(filter.getFilter());
      });

      query.filter = filterQuery;
    }

    url = url + buildQuery(query);
      
    return this.httpClient.get(url) as Observable<object>;
  }

  mapResult(result) {
    return result.value;
  }

  set filters(filters: ODataFilter[]) { this.filtersSubject.next(filters); }
  get filters() { return this.filtersSubject.value; }
}