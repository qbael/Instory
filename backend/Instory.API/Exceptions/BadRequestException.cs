using System;

namespace Instory.API.Exceptions;

// Dùng cho các lỗi như: Đã report rồi, Dữ liệu sai, v.v.
public class BadRequestException(string message) : Exception(message);