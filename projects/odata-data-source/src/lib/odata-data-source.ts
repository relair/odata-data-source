import { DataSource } from '@angular/cdk/table';
import { HttpClient } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { Observable, of as observableOf, merge, BehaviorSubject, ObservableInput, Subscription } from 'rxjs';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import buildQuery from 'odata-query';
import { ODataFilter } from './odata-filter';

type SingleSort = {
  active: string,
  direction: 'asc' | 'desc' | '',
  sortChange: EventEmitter<any>
};

type MultiSort = {
  sortedBy: { id: string, direction: 'asc' | 'desc' }[],
  multiSortChange: EventEmitter<any>
};

type Paginator = {
  pageIndex: number,
  pageSize: number,
  length: number,
  page: EventEmitter<any>
}

export class ODataDataSource extends DataSource<any> {

  sort: SingleSort | MultiSort;
  paginator: Paginator;
  selectedFields: string[];
  initialSort: string[];
  expandedFields: string[] | object;

  protected readonly filtersSubject = new BehaviorSubject<ODataFilter[]>(null);

  protected subscription: Subscription;
  protected readonly dataSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(null);
  protected readonly loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  protected readonly errorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly resourcePath: string) {
      super();      
  }

  private createObservablePipe(): Observable<any[]> {
    const observable = this.getObservable();

    return observable.pipe(
      switchMap(() => {
        this.loadingSubject.next(true);

        let page = 0;
        if (this.paginator) {
          page = this.paginator.pageIndex;
        }

        let sortedBy: { id: string, direction: 'asc' | 'desc' }[] = [];

        if (this.sort) {
          if (('multiSortChange' in this.sort)) {
            sortedBy = this.sort.sortedBy;
          }
          else if ('direction' in this.sort && this.sort.active && this.sort.direction) {
            sortedBy.push({ id: this.sort.active, direction: this.sort.direction });
          }
        }        

        const result = this.getData(page, sortedBy, this.filtersSubject.value);
        
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
        this.loadingSubject.next(false);
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
      if (('multiSortChange' in this.sort)) {
        toObserve.push(this.sort.multiSortChange);
      } else if ('sortChange' in this.sort) {
        toObserve.push(this.sort.sortChange);
      }     
    }

    return merge(...toObserve);
  }

  connect(): Observable<any[]> {
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

  get data() {
    return this.dataSubject.value;
  }
  set data(data) {
    this.dataSubject.next(data);
  }

  get loading() {
    return this.loadingSubject.asObservable();
  }

  get errors() {
    return this.errorSubject.asObservable();
  }

  get filtering() {
    return this.filtersSubject.asObservable();
  }

  get filters() { return this.filtersSubject.value; }
  set filters(filters: ODataFilter[]) { this.filtersSubject.next(filters); }

  refresh() {
    this.filtersSubject.next(this.filtersSubject.value);
  }

  protected getData(page: number, sortedBy: { id: string, direction: 'asc' | 'desc' }[], filters: ODataFilter[]): Observable<object> {
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

    if (sortedBy?.length) {
      query.orderBy = sortedBy.map(s => `${s.id} ${s.direction}`);
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

    if (this.expandedFields) {
      query.expand = this.expandedFields;
    }

    url = url + buildQuery(query);
      
    return this.httpClient.get(url) as Observable<object>;
  }

  mapResult(result): any[] {
    return result.value;
  }  
}
