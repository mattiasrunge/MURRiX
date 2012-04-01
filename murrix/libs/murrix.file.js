
$(function()
{
  $.murrix.libs.fileReader = function(file_object)
  {
    this.CHUNK_SIZE = Math.ceil(10485760 * 4); // 20 mb chunks
    
    this.file_object_       = file_object;
    this.number_of_chunks_  = Math.ceil(this.file_object_.size / this.CHUNK_SIZE); 
    
    this.event_handlers_    = { "progress" : function() {}, "error" : function() {}, "chunk_loaded" : function() {} };
    
    this.read_chunk_index_  = -1;
    this.bytes_read_        = 0;
    this.chunk_data_        = null;
    
    this._readerStart = function(event)
    {
      this.bytes_read_ = this.read_chunk_index_ * this.CHUNK_SIZE;
      this.event_handlers_["progress"](this);
    };
    
    this._readerProgress = function(event)
    {
      this.bytes_read_ = this.read_chunk_index_ * this.CHUNK_SIZE + event.loaded;
      this.event_handlers_["progress"](this);
    };
    
    this._readerLoad = function(event)
    {
      this.bytes_read_ = (this.read_chunk_index_ + 1) * this.CHUNK_SIZE;
      
      if (this.bytes_read_ > this.file_object_.size)
      {
        this.bytes_read_ = this.file_object_.size;
      }
      
      this.event_handlers_["progress"](this);

      this.chunk_data_ = event.target.result;
      this.event_handlers_["chunk_loaded"](this);
    };
    
    this._readerError = function(event)
    {
      this.read_chunk_index_--;
      this.bytes_read_ = this.read_chunk_index_ * this.CHUNK_SIZE;
      this.event_handlers_["error"](this);
    };
    
    
    this.bind = function(event_name, callback)
    {
      this.event_handlers_[event_name] = callback;
    }

    this.loadNextChunk = function()
    {
      var self = this;
      var reader = new FileReader();
      var chunk = null;
      
      this.read_chunk_index_++;
      this.bytes_read_ = 0;
      this.chunk_data_ = null;
      
      
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

      if (this.number_of_chunks_ == 1)
      {
        chunk = this.file_object_;
      }
      else
      {
        var start_position = this.read_chunk_index_ * this.CHUNK_SIZE;
        var end_position = start_position + this.CHUNK_SIZE;
        
        if (end_position > this.file_object_.size)
        {
          end_position = this.file_object_.size;
        }
        
        /*console.log("start:" + start_position);
        console.log("end:" + end_position);
        console.log("size:" + this.file_object_.size);*/
        
        if (this.file_object_.webkitSlice)
        {
          chunk = this.file_object_.webkitSlice(start_position, end_position);
        }
        else if (this.file_object_.mozSlice)
        {
          chunk = this.file_object_.mozSlice(start_position, end_position);
        }
        else if (this.file_object_.slice)
        {
          chunk = this.file_object_.slice(start_position, end_position);
        }
        else
        {
          this.read_chunk_index_--;
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
      return this.chunk_data_;
    }
    
    this.getReadChunkIndex = function()
    {
      return this.read_chunk_index_;
    }
    
    this.getReadChunkSize = function()
    {
      return this.getLoadedSize() - (this.read_chunk_index_ * this.CHUNK_SIZE);
    }
    
    this.getName = function()
    {
      return this.file_object_.name;
    }
    
    this.getSize = function()
    {
      return this.file_object_.size;
    }
    
    this.getNumberOfChunks = function()
    {
      return this.number_of_chunks_;
    }
    
    this.getLoadedSize = function()
    {
      return this.bytes_read_;
    }
    
    this.isLastChunk = function()
    {
      return (this.read_chunk_index_ + 1) == this.number_of_chunks_;
    }
  }
  
  
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
    
    var total_time = 0;
    
    var file = new $.murrix.libs.fileReader(event.dataTransfer.files[0]);
    
    file.bind("progress", function(file)
    {
      var loaded_size = file.getLoadedSize() - (file.getReadChunkSize() / 2);
      
      $(".overlay_div").html("load progress: " + Math.round(loaded_size / file.getSize() * 100) + "%");
    });
    
    file.bind("error", function(file)
    {
      console.log("error");
    });
    
    file.bind("chunk_loaded", function(file)
    {
      //console.log("progress: ", Math.round(file.getLoadedSize() / file.getSize() * 100) + "%");
      
      var chunk_time = jQuery.now();
      
      $.murrix.module.db.uploadFileV2(SHA1(file.getName()), file.getReadChunkData(), function(transaction_id, result_code)
      {
        console.log("Chunk upload time was " + (jQuery.now() - chunk_time));
        if (!file.isLastChunk())
        {
          file.loadNextChunk();
        }
        else
        {
          console.log("Upload of " + file.getName() + ", time " + (jQuery.now() - total_time));
        }
      },
      function(event)
      {
        var percent = event.loaded / event.total;

        var loaded_size = file.getLoadedSize() - (file.getReadChunkSize() / 2) + ((file.getReadChunkSize() / 2) * percent);
        
        $(".overlay_div").html("send progress: " + Math.round(loaded_size / file.getSize() * 100) + "%");
      });
      
    });
    
    total_time = jQuery.now();
    
    file.loadNextChunk();
    
  }, false);
});
