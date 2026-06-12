class CustomException implements Exception {
  final String message;
  final String? prefix;

  CustomException(this.message, [this.prefix]);

  @override
  String toString() {
    return "${prefix != null ? '$prefix: ' : ''}$message";
  }
}

class NetworkException extends CustomException {
  NetworkException([String message = 'Please check your internet connection'])
      : super(message, 'Network Error');
}

class ServerException extends CustomException {
  ServerException([String message = 'Failed to communicate with the server'])
      : super(message, 'Server Error');
}

class ValidationException extends CustomException {
  ValidationException(String message) : super(message, 'Validation Error');
}

class AuthException extends CustomException {
  AuthException([String message = 'Authentication failed. Please login again.'])
      : super(message, 'Authentication Error');
}
