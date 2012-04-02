
$(function()
{
  $.murrix.libs.fileReader = function(file_object)
  {
    var self = this;
    
    this.CHUNK_SIZE = Math.ceil(10485760 * 4); // 20 mb chunks
    
    this.file_object_       = file_object;
    this.number_of_chunks_  = Math.ceil(this.file_object_.size / this.CHUNK_SIZE); 
    
    this.event_handlers_    = { "progress" : function() {}, "error" : function() {}, "chunk_loaded" : function() {} };
    
    this.read_chunk_index_  = -1;
    this.bytes_read_        = 0;
    this.chunk_data_        = null;
    
    this._readerStart = function(event)
    {
      self.bytes_read_ = self.read_chunk_index_ * self.CHUNK_SIZE;
      self.event_handlers_["progress"](self);
    };
    
    this._readerProgress = function(event)
    {
      console.log("progress read");
      self.bytes_read_ = self.read_chunk_index_ * self.CHUNK_SIZE + event.loaded;
      self.event_handlers_["progress"](self);
    };
    
    this._readerLoad = function(event)
    {
      self.bytes_read_ = (self.read_chunk_index_ + 1) * self.CHUNK_SIZE;
      
      if (self.bytes_read_ > self.file_object_.size)
      {
        self.bytes_read_ = self.file_object_.size;
      }
      
      self.event_handlers_["progress"](self);

      self.chunk_data_ = event.target.result;
      self.event_handlers_["chunk_loaded"](self);
    };
    
    this._readerError = function(event)
    {
      self.read_chunk_index_--;
      self.bytes_read_ = self.read_chunk_index_ * self.CHUNK_SIZE;
      self.event_handlers_["error"](self);
    };
    
    
    this.bind = function(event_name, callback)
    {
      self.event_handlers_[event_name] = callback;
    }

    this.loadNextChunk = function()
    {
      var reader = new FileReader();
      var chunk = null;
      
      self.read_chunk_index_++;
      self.bytes_read_ = 0;
      self.chunk_data_ = null;
      
      
      if (reader.addEventListener)
      {
        reader.addEventListener("start",    function(event) { self._readerStart(event); },     false);
        reader.addEventListener("progress", function(event) { self._readerProgress(event); },  false);
        reader.addEventListener("load",     function(event) { self._readerLoad(event); },      false);
        reader.addEventListener("error",    function(event) { self._readerError(event); },     false);
      }
      else
      {
        reader.onstart    = function(event) { self._readerStart(event); };
        reader.onprogress = function(event) { self._readerProgress(event); };
        reader.onload     = function(event) { self._readerLoad(event); };
        reader.onerror    = function(event) { self._readerError(event); };
      }

      if (self.number_of_chunks_ == 1)
      {
        chunk = self.file_object_;
      }
      else
      {
        var start_position = self.read_chunk_index_ * self.CHUNK_SIZE;
        var end_position = start_position + self.CHUNK_SIZE;
        
        if (end_position > self.file_object_.size)
        {
          end_position = self.file_object_.size;
        }
        
        /*console.log("start:" + start_position);
        console.log("end:" + end_position);
        console.log("size:" + this.file_object_.size);*/
        
        if (self.file_object_.webkitSlice)
        {
          chunk = self.file_object_.webkitSlice(start_position, end_position);
        }
        else if (self.file_object_.mozSlice)
        {
          chunk = self.file_object_.mozSlice(start_position, end_position);
        }
        else if (self.file_object_.slice)
        {
          chunk = self.file_object_.slice(start_position, end_position);
        }
        else
        {
          self.read_chunk_index_--;
          self.event_handlers_["error"](self);
        }
      }
      
      if (chunk)
      {
        reader.readAsBinaryString(chunk);
      }
    }
    
    this.getReadChunkData = function()
    {
      return self.chunk_data_;
    }
    
    this.getReadChunkIndex = function()
    {
      return self.read_chunk_index_;
    }
    
    this.getReadChunkSize = function()
    {
      return self.getLoadedSize() - (self.read_chunk_index_ * self.CHUNK_SIZE);
    }
    
    this.getName = function()
    {
      return self.file_object_.name;
    }
    
    this.getSize = function()
    {
      return self.file_object_.size;
    }
    
    this.getNumberOfChunks = function()
    {
      return self.number_of_chunks_;
    }
    
    this.getLoadedSize = function()
    {
      return self.bytes_read_;
    }
    
    this.isLastChunk = function()
    {
      return (self.read_chunk_index_ + 1) == self.number_of_chunks_;
    }
  }
  
  
  
  $.murrix.libs.fileUploader = function(file_object)
  {
    var self = this;
    
    this.file_reader_     = new $.murrix.libs.fileReader(file_object);
    this.event_handlers_  = { "progress" : function() {}, "error" : function() {}, "complete" : function() {} };
    this.loaded_size_     = 0;
    this.uploaded_size_   = 0;
    this.start_time_      = jQuery.now();
    this.upload_id_       = "file_" + jQuery.now();
    this.upload_time_     = 0;

    
    this.file_reader_.bind("progress", function(file)
    {
      console.log("progress upload");
      self.loaded_size_ = file.getLoadedSize();

      self.event_handlers_["progress"](self);
    });
    
    
    this.file_reader_.bind("error", function(file)
    {
      self.event_handlers_["error"](self);
    });
    
    
    this.file_reader_.bind("chunk_loaded", function(file)
    {
      var chunk_time = jQuery.now();
      
      $.murrix.module.db.uploadFileV2(self.upload_id_, file.getReadChunkData(), function(transaction_id, result_code)
      {
        self.upload_time_ = jQuery.now() - self.start_time_;
        
        if (!file.isLastChunk())
        {
          file.loadNextChunk();
        }
        else
        {
          self.event_handlers_["complete"](self);
        }
      },
      function(event)
      {
        self.uploaded_size_ = self.loaded_size_ - self.file_reader_.getReadChunkSize() + event.loaded;
        
        self.event_handlers_["progress"](self);
      });
    });

    
    this.start = function()
    {
      self.file_reader_.loadNextChunk();
    }
    
    this.bind = function(event_name, callback)
    {
      self.event_handlers_[event_name] = callback;
    }
    
    this.getFile = function()
    {
      return self.file_reader_;
    }
    
    this.getLoadedSize = function()
    {
      return self.loaded_size_;
    }
    
    this.getUploadedSize = function()
    {
      return self.uploaded_size_;
    }
  };
    
    
    
    
    

  
  
  
  
  
  
  
  $(".overlay_div").get(0).addEventListener("dragover", function(event)
  {
    event.stopPropagation(); 
    event.preventDefault();
    return false;
  }, true);
  
  
  $(".overlay_div").get(0).addEventListener("drop", function(event)
  {
    event.stopPropagation(); 
    event.preventDefault();
    
    var uploader = new $.murrix.libs.fileUploader(event.dataTransfer.files[0]);
    

    uploader.bind("progress", function(uploader)
    {
      $(".overlay_div").empty();
      $(".overlay_div").append("load progress: " + Math.round(uploader.getLoadedSize() / uploader.getFile().getSize() * 100) + "%<br/>");
      $(".overlay_div").append("upload progress: " + Math.round(uploader.getUploadedSize() / uploader.getFile().getSize() * 100) + "%<br/>");
      $(".overlay_div").append("total progress: " + Math.round((uploader.getLoadedSize() + uploader.getUploadedSize()) / (uploader.getFile().getSize() * 2) * 100) + "%<br/>");
    });
    
    uploader.bind("error", function(uploader)
    {
      console.log("error");
    });
    
    uploader.bind("complete", function(file)
    {
      console.log("complete!");
    });
        
    uploader.start();
    
  }, false);
});
