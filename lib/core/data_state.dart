abstract class DataState<T> {
  const DataState();
}

class DataInitial<T> extends DataState<T> {
  const DataInitial();
}

class DataLoading<T> extends DataState<T> {
  const DataLoading();
}

class DataEmpty<T> extends DataState<T> {
  const DataEmpty();
}

class DataSuccess<T> extends DataState<T> {
  final T data;
  const DataSuccess(this.data);
}

class DataError<T> extends DataState<T> {
  final String message;
  final Exception? exception;

  const DataError(this.message, [this.exception]);
}
