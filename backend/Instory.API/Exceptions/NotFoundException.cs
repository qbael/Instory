using System;

namespace Instory.API.Exceptions;

public class NotFoundException(string message) : Exception(message);