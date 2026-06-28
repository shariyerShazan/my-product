import { Observable } from 'rxjs';

export interface MediaGrpcService {
  createMedia(data: any): Observable<any>;

  getMedia(data: { mediaId: string }): Observable<any>;

  listUserMedia(data: {
    userId: string;
    type: string;
    page: number;
    limit: number;
  }): Observable<any>;

  deleteMedia(data: { mediaId: string; userId: string }): Observable<any>;

  exists(data: { mediaId: string }): Observable<any>;

  updateMediaStatus(data: any): Observable<any>;

  getMediaByPath(data: { path: string }): Observable<any>;
}
